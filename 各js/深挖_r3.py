#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深挖_r3.py
============================================================
TVBox / Android APK / Native SO / DEX / JAR / JPG 全自动静态分析工具

设计目标：
1. 不传参数时，自动扫描当前目录
2. 自动识别 APK / JAR / DEX / SO / JPG / BIN
3. APK 自动枚举 DEX 和 native libraries
4. DEX 做字符串、类/方法、关键调用链关键词扫描
5. SO 做 ELF / SONAME / NEEDED / JNI / RegisterNatives / 加密关键词扫描
6. 尝试识别 ARM64 常见 JNI 调用槽位和 RegisterNatives 附近证据
7. 自动寻找 JPG -> 解码/解密 -> ZIP/JAR/DEX 的可疑证据
8. 输出 TXT + JSON 报告
9. 纯 Python 标准库；不要求安装第三方库
10. 不执行 APK、DEX、SO、JAR，只做静态读取

用法：
    py 深挖_r3.py

也可以：
    py 深挖_r3.py leanback-arm64_v8a.apk fde98e16f633df0c74af53fd69aa8cd0.so

可选：
    py 深挖_r3.py --root D:\reverse
    py 深挖_r3.py --deep
    py 深挖_r3.py --max-bytes 200000000

注意：
- 本工具不会联网。
- 不会运行 APK / SO / JAR。
- 如果没有 objdump/readelf，也会尽量完成分析。
"""

import os
import re
import sys
import json
import math
import hashlib
import struct
import zipfile
import argparse
from pathlib import Path
from collections import Counter, defaultdict

VERSION = "r3.0"

DEFAULT_EXTS = {
    ".apk", ".jar", ".zip", ".dex", ".so",
    ".jpg", ".jpeg", ".jfif", ".bin", ".dat"
}

# 关键词分层：避免把普通 AES 字符串和真正的处理链混为一谈
#maflya.com   ,TG频道  https://t.me/flymaf 
KEY_GROUPS = {
    "JNI": [
        "JNI_OnLoad", "RegisterNatives", "FindClass", "GetMethodID",
        "GetStaticMethodID", "GetStringUTFChars", "NewStringUTF",
        "GetByteArrayElements", "ReleaseByteArrayElements",
        "GetStringUTFRegion", "NewDirectByteBuffer"
    ],
    "CRYPTO": [
        "AES", "AES/CBC", "AES/ECB", "AES/GCM",
        "DES", "DESede", "RC4", "ChaCha", "RSA",
        "MD5", "SHA1", "SHA-1", "SHA256", "SHA-256",
        "Base64", "base64", "decrypt", "Decrypt",
        "encrypt", "Encrypt", "decode", "Decode",
        "encode", "Encode", "Cipher"
    ],
    "FILE_FLOW": [
        "open", "read", "write", "fopen", "fread", "fwrite",
        "FileInputStream", "FileOutputStream", "RandomAccessFile",
        "ZipInputStream", "ZipOutputStream", "ZipFile",
        "DexClassLoader", "PathClassLoader", "ClassLoader",
        "mmap", "munmap", "memcpy", "memmove",
        "dlopen", "dlsym"
    ],
    "TVBOX": [
        "com.github.catvod.spider.Init",
        "com.github.catvod.spider.Proxy",
        "csp_Builtin", "__custom_csp_", "TV/CustomCsp",
        "registry.json", "spider", "localProxy", "goproxy",
        ";md5;", "Wexconfig", "PanConfigGuard",
        "AiWex", "libdecjni", "libwexproxy", "awenc-v8",
        "libmitv"
    ],
    "FORMAT": [
        "PK\\x03\\x04", "classes.dex", "AndroidManifest.xml",
        "JFIF", "Exif", "FFD8", "FFD9", "jar", "dex", "zip"
    ],
}

JNI_SLOT_NAMES = {
    0x30: "FindClass",
    0x38: "FromReflectedMethod",
    0x40: "FromReflectedField",
    0x48: "ToReflectedMethod",
    0x50: "GetSuperclass",
    0x58: "IsAssignableFrom",
    0x60: "ToReflectedField",
    0x68: "Throw",
    0x70: "ThrowNew",
    0x78: "ExceptionOccurred",
    0x80: "ExceptionDescribe",
    0x88: "ExceptionClear",
    0x90: "FatalError",
    0x98: "PushLocalFrame",
    0xa0: "PopLocalFrame",
    0xa8: "NewGlobalRef",
    0xb0: "DeleteGlobalRef",
    0xb8: "DeleteLocalRef",
    0xc0: "IsSameObject",
    0xc8: "NewLocalRef",
    0xd0: "EnsureLocalCapacity",
    0x108: "GetMethodID",
    0x110: "CallObjectMethod",
    0x118: "CallBooleanMethod",
    0x120: "CallByteMethod",
    0x128: "CallCharMethod",
    0x130: "CallShortMethod",
    0x138: "CallIntMethod",
    0x140: "CallLongMethod",
    0x148: "CallFloatMethod",
    0x150: "CallDoubleMethod",
    0x158: "CallVoidMethod",
    0x1b8: "GetStaticMethodID",
    0x6b8: "RegisterNatives",
}

ARM64_REG_RE = re.compile(
    r"\b(?P<reg>x(?:[0-2]?[0-9]|3[0-1]))\b", re.I
)

ASCII_RE = re.compile(rb"[\x20-\x7e]{4,}")

def human_size(n):
    units = ["B", "KB", "MB", "GB"]
    x = float(n)
    for u in units:
        if x < 1024:
            return f"{x:.2f} {u}"
        x /= 1024
    return f"{x:.2f} TB"

def sha_file(path, chunk=1024*1024):
    md5 = hashlib.md5()
    sha = hashlib.sha256()
    total = 0
    with open(path, "rb") as f:
        while True:
            b = f.read(chunk)
            if not b:
                break
            total += len(b)
            md5.update(b)
            sha.update(b)
    return total, md5.hexdigest(), sha.hexdigest()

def printable_strings(data, min_len=4):
    out = []
    for m in ASCII_RE.finditer(data):
        try:
            out.append((m.start(), m.group().decode("ascii", "replace")))
        except Exception:
            pass
    return out

def keyword_hits(data, keyword, max_hits=300):
    if isinstance(keyword, str):
        kb = keyword.encode("ascii", "ignore")
    else:
        kb = keyword
    if not kb:
        return []
    hits = []
    pos = 0
    while len(hits) < max_hits:
        p = data.find(kb, pos)
        if p < 0:
            break
        hits.append(p)
        pos = p + 1
    return hits

def near_ascii(data, offset, radius=180):
    a = max(0, offset-radius)
    b = min(len(data), offset+radius)
    chunk = data[a:b]
    vals = []
    for m in ASCII_RE.finditer(chunk):
        vals.append((a+m.start(), m.group().decode("ascii", "replace")))
    return vals

def detect_magic(data):
    result = []
    if data.startswith(b"\x7fELF"):
        result.append("ELF")
    if data.startswith(b"PK\x03\x04"):
        result.append("ZIP/JAR/APK")
    if data.startswith(b"dex\n"):
        result.append("DEX")
    if data.startswith(b"\xff\xd8\xff"):
        result.append("JPEG")
    if data.startswith(b"\xCA\xFE\xBA\xBE"):
        result.append("JAVA_CLASS")
    if b"PK\x03\x04" in data[:4096]:
        result.append("ZIP_SIGNATURE_NEAR_HEAD")
    if b"dex\n" in data[:1024*1024]:
        result.append("DEX_SIGNATURE_FOUND")
    return result

def scan_keywords(data, groups=None):
    groups = groups or KEY_GROUPS
    result = {}
    for group, keys in groups.items():
        gr = {}
        for k in keys:
            # 特殊字符串
            if "\\x" in k:
                try:
                    kb = k.encode().decode("unicode_escape").encode("latin1")
                except Exception:
                    kb = k.encode("utf-8", "ignore")
            else:
                kb = k.encode("utf-8", "ignore")
            hits = keyword_hits(data, kb)
            if hits:
                gr[k] = hits[:100]
        if gr:
            result[group] = gr
    return result

def score_chain(keyword_result):
    score = 0
    reasons = []
    if "JNI" in keyword_result:
        score += 10
        reasons.append("JNI")
    if "CRYPTO" in keyword_result:
        score += 10
        reasons.append("加密/解密关键词")
    if "FILE_FLOW" in keyword_result:
        score += 8
        reasons.append("文件/内存处理")
    if "TVBOX" in keyword_result:
        score += 12
        reasons.append("TVBox/CatVod相关")
    if "FORMAT" in keyword_result:
        score += 5
        reasons.append("JAR/DEX/ZIP/JPEG格式")
    # 强组合
    if "CRYPTO" in keyword_result and "FILE_FLOW" in keyword_result:
        score += 15
        reasons.append("加密 + 文件处理组合")
    if "CRYPTO" in keyword_result and "FORMAT" in keyword_result:
        score += 15
        reasons.append("加密 + 文件格式组合")
    if "TVBOX" in keyword_result and "FILE_FLOW" in keyword_result:
        score += 15
        reasons.append("TVBox + 文件处理组合")
    return score, reasons

def elf_info(data):
    if len(data) < 64 or not data.startswith(b"\x7fELF"):
        return {}
    ei_class = data[4]
    endian = "<" if data[5] == 1 else ">"
    info = {
        "class": "ELF64" if ei_class == 2 else "ELF32" if ei_class == 1 else str(ei_class),
        "endian": "little" if endian == "<" else "big",
        "machine": None,
        "type": None,
        "entry": None,
        "phoff": None,
        "shoff": None,
        "phnum": None,
        "shnum": None,
        "shstrndx": None,
        "needed": [],
        "soname": None,
        "sections": []
    }
    try:
        if ei_class == 2:
            info["type"], info["machine"] = struct.unpack_from(endian+"HH", data, 16)
            info["entry"] = struct.unpack_from(endian+"Q", data, 24)[0]
            info["phoff"] = struct.unpack_from(endian+"Q", data, 32)[0]
            info["shoff"] = struct.unpack_from(endian+"Q", data, 40)[0]
            info["phnum"] = struct.unpack_from(endian+"H", data, 56)[0]
            info["shnum"] = struct.unpack_from(endian+"H", data, 60)[0]
            info["shstrndx"] = struct.unpack_from(endian+"H", data, 62)[0]
        elif ei_class == 1:
            info["type"], info["machine"] = struct.unpack_from(endian+"HH", data, 16)
            info["entry"] = struct.unpack_from(endian+"I", data, 24)[0]
            info["phoff"] = struct.unpack_from(endian+"I", data, 28)[0]
            info["shoff"] = struct.unpack_from(endian+"I", data, 32)[0]
            info["phnum"] = struct.unpack_from(endian+"H", data, 44)[0]
            info["shnum"] = struct.unpack_from(endian+"H", data, 48)[0]
            info["shstrndx"] = struct.unpack_from(endian+"H", data, 50)[0]
    except Exception:
        return info

    # machine
    machines = {183:"AArch64", 62:"x86-64", 40:"ARM", 3:"x86", 8:"MIPS"}
    info["machine_name"] = machines.get(info["machine"], str(info["machine"]))

    # section names / dynamic strings
    try:
        if ei_class == 2:
            sh_size = 64
            fields_fmt = endian+"IIQQQQIIQQ"
        else:
            sh_size = 40
            fields_fmt = endian+"IIIIIIIIII"
        shoff = info["shoff"]
        shnum = info["shnum"]
        if shoff and shnum and shoff + sh_size*shnum <= len(data):
            sections_raw = []
            for i in range(shnum):
                vals = struct.unpack_from(fields_fmt, data, shoff+i*sh_size)
                sections_raw.append(vals)
            shstr = sections_raw[info["shstrndx"]] if info["shstrndx"] < len(sections_raw) else None
            if shstr:
                if ei_class == 2:
                    soff, ssize = shstr[4], shstr[5]
                else:
                    soff, ssize = shstr[4], shstr[5]
                names = data[soff:soff+ssize]
                for i, s in enumerate(sections_raw):
                    no = s[0]
                    end = names.find(b"\0", no)
                    name = names[no:end].decode("ascii","replace") if end >= 0 else ""
                    info["sections"].append(name)
    except Exception:
        pass

    # fallback string extraction for NEEDED / SONAME, because fully parsing dynamic tables
    # is not necessary to provide useful first-pass evidence.
    strings = [s for _, s in printable_strings(data, 4)]
    for s in strings:
        if s.startswith("lib") and s.endswith(".so"):
            if s not in info["needed"]:
                info["needed"].append(s)
        if s.startswith("AW") and len(s) < 80:
            pass
    for s in strings:
        if s.endswith(".so") and "awenc" in s.lower():
            info["soname"] = s
            break
    return info

def zip_info(path):
    result = {"valid": False, "entries": 0, "dex_files": [], "native_libs": [],
              "interesting": [], "sizes": {}}
    try:
        with zipfile.ZipFile(path, "r") as z:
            result["valid"] = z.testzip() is None
            names = z.namelist()
            result["entries"] = len(names)
            for n in names:
                ln = n.lower()
                if ln.endswith(".dex"):
                    result["dex_files"].append(n)
                if ln.endswith(".so"):
                    result["native_libs"].append(n)
                if any(x in ln for x in [
                    "crypto", "catvod", "spider", "quickjs", "mitv",
                    "registry", "custom", "js/lib", "assets/lib"
                ]):
                    result["interesting"].append(n)
                try:
                    result["sizes"][n] = z.getinfo(n).file_size
                except Exception:
                    pass
    except Exception as e:
        result["error"] = str(e)
    return result

def dex_header(data):
    if len(data) < 112 or not data.startswith(b"dex\n"):
        return {}
    try:
        return {
            "magic": data[:8].decode("latin1", "replace"),
            "checksum": data[8:12].hex(),
            "sha1": data[12:32].hex(),
            "file_size": struct.unpack_from("<I", data, 32)[0],
            "header_size": struct.unpack_from("<I", data, 36)[0],
            "endian_tag": hex(struct.unpack_from("<I", data, 40)[0]),
            "string_ids_size": struct.unpack_from("<I", data, 56)[0],
            "type_ids_size": struct.unpack_from("<I", data, 64)[0],
            "proto_ids_size": struct.unpack_from("<I", data, 72)[0],
            "field_ids_size": struct.unpack_from("<I", data, 80)[0],
            "method_ids_size": struct.unpack_from("<I", data, 88)[0],
            "class_defs_size": struct.unpack_from("<I", data, 96)[0],
        }
    except Exception:
        return {}

def parse_source_md5_strings(data):
    text = data.decode("utf-8", "ignore")
    found = []
    for m in re.finditer(r"([^\\s\"']+);md5;([0-9a-fA-F]{32})", text):
        found.append({"source": m.group(1), "md5": m.group(2)})
    return found[:100]

def format_hits(hits):
    return ", ".join(str(x) for x in hits[:100])

def find_register_candidates(data):
    """
    不依赖反汇编器的 ARM64 粗定位：
    AArch64 BL 指令只能在已知文本布局下可靠解码。
    因此这里优先寻找：
      - ASCII RegisterNatives
      - 典型小整数常量 21/29 周边
      - 504 / 696 字节 table-size 线索
    如果系统存在 llvm-objdump/objdump，会由外层调用。
    """
    candidates = []
    for val in (21, 29):
        patt = struct.pack("<I", val)
        for p in keyword_hits(data, patt, 1000):
            # 避免大量随机数字造成报告爆炸
            if p % 4 == 0:
                candidates.append({
                    "type": "little_endian_uint32",
                    "value": val,
                    "offset": p,
                    "table_bytes_if_JNINativeMethod": val * 24
                })
    return candidates[:200]

def scan_jpeg_structure(data):
    r = {
        "soi": data[:3] == b"\xff\xd8\xff",
        "eoi_offsets": [],
        "pk_offsets": [],
        "dex_offsets": [],
        "elf_offsets": [],
        "ascii_ratio": 0.0,
        "length": len(data),
    }
    p = 0
    while True:
        p = data.find(b"\xff\xd9", p)
        if p < 0: break
        r["eoi_offsets"].append(p)
        p += 2
        if len(r["eoi_offsets"]) >= 20: break

    for sig, key in [
        (b"PK\x03\x04","pk_offsets"),
        (b"dex\n","dex_offsets"),
        (b"\x7fELF","elf_offsets"),
    ]:
        p = 0
        while True:
            p = data.find(sig,p)
            if p < 0: break
            r[key].append(p)
            p += 1
            if len(r[key]) >= 50: break

    sample = data[:min(len(data), 1024*1024)]
    if sample:
        r["ascii_ratio"] = sum(1 for x in sample if 32 <= x <= 126) / len(sample)
    return r

def run_external_disasm(path):
    """
    尝试调用 llvm-objdump / objdump。
    不要求存在；不存在就返回说明。
    """
    import shutil, subprocess
    tools = [
        ("llvm-objdump", ["llvm-objdump", "-d", "-C", str(path)]),
        ("objdump", ["objdump", "-d", str(path)]),
        ("aarch64-linux-gnu-objdump", ["aarch64-linux-gnu-objdump", "-d", str(path)]),
    ]
    for name, cmd in tools:
        if shutil.which(name):
            try:
                p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   timeout=90)
                out = p.stdout.decode("utf-8","replace")
                return {"tool": name, "text": out[:5_000_000], "error": p.stderr.decode("utf-8","replace")}
            except Exception as e:
                return {"tool": name, "error": str(e)}
    return {"available": False, "reason": "未找到 llvm-objdump / objdump / aarch64-linux-gnu-objdump"}

def extract_disasm_evidence(disasm):
    if not disasm or "text" not in disasm:
        return {}
    text = disasm["text"]
    lines = text.splitlines()
    evidence = defaultdict(list)

    for i, line in enumerate(lines):
        low = line.lower()
        if "registernatives" in low:
            evidence["RegisterNatives"].append({
                "line": i+1,
                "context": "\n".join(lines[max(0,i-8):min(len(lines),i+9)])
            })
        for token in ["#0x6b8", "#0x108", "#0xb8", "#0x30"]:
            if token in low:
                evidence["JNI_SLOT_"+token].append({
                    "line": i+1,
                    "context": "\n".join(lines[max(0,i-3):min(len(lines),i+4)])
                })
        for token in ["aes", "rc4", "md5", "rsa", "decrypt", "encrypt", "base64"]:
            if token in low:
                evidence["CRYPTO_"+token].append({
                    "line": i+1,
                    "context": "\n".join(lines[max(0,i-3):min(len(lines),i+4)])
                })
    # 限量
    return {k:v[:100] for k,v in evidence.items()}

def analyze_one(path, max_bytes=None, do_deep=False):
    p = Path(path)
    try:
        st = p.stat()
    except Exception as e:
        return {"path": str(p), "error": str(e)}

    size, md5, sha256 = sha_file(p)
    read_size = size if max_bytes is None else min(size, max_bytes)

    with open(p, "rb") as f:
        data = f.read(read_size)

    suffix = p.suffix.lower()
    magic = detect_magic(data)
    kws = scan_keywords(data)
    score, reasons = score_chain(kws)

    r = {
        "path": str(p.resolve()),
        "name": p.name,
        "suffix": suffix,
        "size": size,
        "human_size": human_size(size),
        "md5": md5,
        "sha256": sha256,
        "magic": magic,
        "score": score,
        "score_reasons": reasons,
        "keywords": kws,
    }

    if suffix in (".apk",".jar",".zip") or "ZIP/JAR/APK" in magic:
        r["zip"] = zip_info(p)

        # APK 内部做第二层扫描
        if suffix == ".apk":
            inner = []
            try:
                with zipfile.ZipFile(p, "r") as z:
                    for name in z.namelist():
                        if name.lower().endswith((".dex",".so",".js",".json",".txt",".jar")):
                            try:
                                b = z.read(name)
                            except Exception:
                                continue
                            ik = scan_keywords(b)
                            sc, rs = score_chain(ik)
                            if ik or sc:
                                inner.append({
                                    "name": name,
                                    "size": len(b),
                                    "score": sc,
                                    "reasons": rs,
                                    "keywords": ik,
                                })
            except Exception as e:
                r["apk_inner_error"] = str(e)

            r["apk_inner_interesting"] = sorted(
                inner, key=lambda x:x["score"], reverse=True
            )[:250]

            # 提取 source;md5
            sources = []
            try:
                with zipfile.ZipFile(p, "r") as z:
                    for name in z.namelist():
                        if name.lower().endswith((".json",".txt",".js",".xml")):
                            try:
                                b = z.read(name)
                            except Exception:
                                continue
                            found = parse_source_md5_strings(b)
                            if found:
                                sources.extend([{"file":name, **x} for x in found])
            except Exception:
                pass
            r["source_md5_candidates"] = sources[:200]

    if suffix == ".dex" or "DEX" in magic:
        r["dex"] = dex_header(data)
        r["ascii_strings"] = printable_strings(data)[:1000]

    if suffix == ".so" or "ELF" in magic:
        r["elf"] = elf_info(data)
        r["register_candidates"] = find_register_candidates(data)
        if do_deep:
            dis = run_external_disasm(p)
            r["disasm_status"] = {
                k: (v if k != "text" else "已生成内部证据文本")
                for k,v in dis.items()
            }
            r["disasm_evidence"] = extract_disasm_evidence(dis)

    if suffix in (".jpg",".jpeg",".jfif"):
        r["jpeg"] = scan_jpeg_structure(data)

    # 任何文件都做 source;md5 轻扫描
    r["source_md5_candidates"] = parse_source_md5_strings(data)[:100]

    # 周边字符串证据
    evidence = []
    for group, vals in kws.items():
        for key, hits in vals.items():
            for off in hits[:10]:
                evidence.append({
                    "group": group,
                    "keyword": key,
                    "offset": off,
                    "near_ascii": near_ascii(data, off, 120)[:20]
                })
    r["evidence"] = evidence[:500]

    return r

def build_chain(results):
    chain = {
        "hypothesis": "寻找 JPG/HTTP 源 → 下载 → 校验 → 解码/解密 → JAR/DEX → DexClassLoader/Spider 的静态证据",
        "steps": [],
        "strong_files": []
    }

    for r in results:
        score = r.get("score",0)
        if score >= 25:
            chain["strong_files"].append({
                "file": r.get("path"),
                "score": score,
                "reasons": r.get("score_reasons",[])
            })

    # APK
    for r in results:
        if r.get("suffix") == ".apk":
            z = r.get("zip",{})
            chain["steps"].append({
                "stage": "APK",
                "file": r.get("path"),
                "dex_files": z.get("dex_files",[]),
                "native_libs": z.get("native_libs",[]),
                "interesting": z.get("interesting",[])[:100],
                "source_md5_candidates": r.get("source_md5_candidates",[])[:50]
            })

    # Native
    for r in results:
        if r.get("suffix") == ".so":
            k = r.get("keywords",{})
            chain["steps"].append({
                "stage": "NATIVE",
                "file": r.get("path"),
                "score": r.get("score"),
                "JNI": k.get("JNI",{}),
                "CRYPTO": k.get("CRYPTO",{}),
                "FILE_FLOW": k.get("FILE_FLOW",{}),
                "elf": r.get("elf",{}),
                "register_candidates": r.get("register_candidates",[])[:50],
                "disasm_evidence": r.get("disasm_evidence",{})
            })

    # JPG
    for r in results:
        if r.get("suffix") in (".jpg",".jpeg",".jfif"):
            chain["steps"].append({
                "stage": "JPG_SOURCE",
                "file": r.get("path"),
                "jpeg": r.get("jpeg",{}),
                "keywords": r.get("keywords",{})
            })

    return chain

def text_report(results, chain, root):
    lines = []
    lines.append("="*78)
    lines.append(f"深挖_r3 全自动静态分析报告  {VERSION}")
    lines.append("="*78)
    lines.append(f"扫描目录: {root}")
    lines.append(f"文件数: {len(results)}")
    lines.append("")

    lines.append("【一、优先级排行】")
    ranked = sorted(results, key=lambda x:x.get("score",0), reverse=True)
    for i,r in enumerate(ranked,1):
        lines.append(
            f"{i:02d}. score={r.get('score',0):3d}  "
            f"{r.get('human_size','?'):>10}  "
            f"{r.get('name','?')}"
        )
        if r.get("score_reasons"):
            lines.append("    " + " + ".join(r["score_reasons"]))
    lines.append("")

    for r in ranked:
        lines.append("-"*78)
        lines.append(f"【文件】{r.get('path')}")
        if r.get("error"):
            lines.append("错误: "+r["error"])
            continue
        lines.append(f"类型: {r.get('suffix')}  Magic: {', '.join(r.get('magic',[]))}")
        lines.append(f"大小: {r.get('size')} ({r.get('human_size')})")
        lines.append(f"MD5: {r.get('md5')}")
        lines.append(f"SHA256: {r.get('sha256')}")
        lines.append(f"风险/关联评分: {r.get('score')}")
        lines.append(f"评分原因: {', '.join(r.get('score_reasons',[])) or '普通文件'}")

        kws = r.get("keywords",{})
        if kws:
            lines.append("关键词:")
            for g,vals in kws.items():
                lines.append(f"  [{g}]")
                for k,h in vals.items():
                    lines.append(f"    {k}: {format_hits(h)}")

        if r.get("zip"):
            z=r["zip"]
            lines.append("ZIP/APK:")
            lines.append(f"  entries={z.get('entries')}")
            lines.append(f"  dex={z.get('dex_files')}")
            lines.append(f"  native={z.get('native_libs')}")
            lines.append(f"  interesting={z.get('interesting')[:100]}")

        if r.get("source_md5_candidates"):
            lines.append("source;md5 候选:")
            for x in r["source_md5_candidates"][:30]:
                lines.append(f"  {x}")

        if r.get("dex"):
            lines.append("DEX:")
            for k,v in r["dex"].items():
                lines.append(f"  {k}: {v}")

        if r.get("elf"):
            e=r["elf"]
            lines.append("ELF:")
            for k in ["class","endian","machine_name","machine","type","entry","phoff","shoff","phnum","shnum","shstrndx","soname","needed"]:
                if k in e:
                    lines.append(f"  {k}: {e[k]}")
            if e.get("sections"):
                lines.append("  sections: "+", ".join(e["sections"][:100]))

        if r.get("register_candidates"):
            lines.append("RegisterNatives/方法表粗定位候选:")
            for x in r["register_candidates"][:80]:
                lines.append(f"  {x}")

        if r.get("jpeg"):
            lines.append("JPEG结构:")
            for k,v in r["jpeg"].items():
                lines.append(f"  {k}: {v}")

        de=r.get("disasm_evidence")
        if de:
            lines.append("反汇编证据:")
            for k,vals in de.items():
                lines.append(f"  [{k}]")
                for x in vals[:10]:
                    lines.append(f"    line={x['line']}")
                    lines.append("    "+x["context"].replace("\n","\n    "))

        ev=r.get("evidence",[])
        if ev:
            lines.append("局部字符串证据（前20）:")
            for x in ev[:20]:
                lines.append(
                    f"  {x['group']}/{x['keyword']} @ {x['offset']}: "
                    f"{x['near_ascii'][:8]}"
                )

    lines.append("")
    lines.append("="*78)
    lines.append("【二、JPG → 解码/解密 → JAR/DEX 证据链汇总】")
    lines.append("="*78)
    lines.append(chain.get("hypothesis",""))
    for s in chain.get("steps",[]):
        lines.append("")
        lines.append(f"[{s.get('stage')}] {s.get('file')}")
        for k,v in s.items():
            if k not in ("stage","file"):
                txt=json.dumps(v,ensure_ascii=False,indent=2)
                if len(txt)>8000: txt=txt[:8000]+"\n...[截断]"
                lines.append(txt)

    lines.append("")
    lines.append("【三、下一步人工定位建议】")
    lines.append("1. 优先看 score 最高的 .so；特别关注同时命中 JNI + CRYPTO + FILE_FLOW 的文件。")
    lines.append("2. APK 中同时出现 QuickJS/CryptoJS/CatVod 时，不能只假设 Native 解密。")
    lines.append("3. 如果出现 RegisterNatives，继续从其前后恢复 JNINativeMethod 三元组：name/signature/fnPtr。")
    lines.append("4. 如果 JPG 内出现 PK\\x03\\x04、dex\\n、ELF，则重点检查是否为容器/拼接/尾部载荷。")
    lines.append("5. 如果 JPG 没有格式签名但 APK 把下载结果交给 DexClassLoader，则继续追踪下载缓存文件第一次被读取的位置。")
    lines.append("6. `;md5;` 应作为完整性校验线索处理，不要直接当 AES key。")
    lines.append("7. 本报告只做静态证据收集；任何“确定是某算法/某Key”的结论都需要调用链或动态验证支持。")
    return "\n".join(lines)

def main():
    ap=argparse.ArgumentParser(description="TVBox/Android 全自动静态深挖工具")
    ap.add_argument("files", nargs="*", help="待分析文件；不填则扫描当前目录")
    ap.add_argument("--root", default=".", help="无参数时扫描的目录")
    ap.add_argument("--deep", action="store_true", help="对 SO 尝试调用 objdump/llvm-objdump")
    ap.add_argument("--max-bytes", type=int, default=0,
                    help="单文件最多读取多少字节；0=完整读取")
    args=ap.parse_args()

    root=Path(args.root).resolve()
    if args.files:
        paths=[Path(x).resolve() for x in args.files if Path(x).is_file()]
    else:
        paths=[]
        for p in sorted(root.iterdir()):
            if p.is_file() and p.suffix.lower() in DEFAULT_EXTS:
                paths.append(p)

    if not paths:
        print("没有找到可分析文件。")
        print(f"当前目录: {root}")
        print("请把 APK/SO/JAR/JPG 放进该目录，或使用：")
        print("  py 深挖_r3.py 文件.apk 文件.so")
        return 1

    print("="*70)
    print(f"深挖_r3 {VERSION}")
    print(f"扫描文件: {len(paths)}")
    print("="*70)

    results=[]
    for i,p in enumerate(paths,1):
        print(f"[{i}/{len(paths)}] 分析: {p.name}")
        try:
            r=analyze_one(p, args.max_bytes or None, args.deep)
            results.append(r)
            print(f"    score={r.get('score',0)}  size={r.get('human_size','?')}")
        except Exception as e:
            results.append({"path":str(p),"name":p.name,"error":repr(e)})
            print("    ERROR:",repr(e))

    chain=build_chain(results)

    outdir=root / "深挖_r3_报告"
    outdir.mkdir(exist_ok=True)

    json_path=outdir/"深挖_r3_报告.json"
    txt_path=outdir/"深挖_r3_报告.txt"

    payload={
        "tool": "深挖_r3.py",
        "version": VERSION,
        "root": str(root),
        "file_count": len(results),
        "results": results,
        "chain": chain,
    }

    with open(json_path,"w",encoding="utf-8") as f:
        json.dump(payload,f,ensure_ascii=False,indent=2)

    report=text_report(results,chain,root)
    with open(txt_path,"w",encoding="utf-8") as f:
        f.write(report)

    print("")
    print("="*70)
    print("分析完成")
    print("="*70)
    print(f"TXT : {txt_path}")
    print(f"JSON: {json_path}")
    print("")
    print("最高优先级：")
    for r in sorted(results,key=lambda x:x.get("score",0),reverse=True)[:10]:
        print(f"  score={r.get('score',0):3d}  {r.get('name')}")
    print("")
    print("如果系统有 llvm-objdump/objdump，可使用：")
    print("  py 深挖_r3.py --deep")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
