/**
 * @fileoverview String <-> UTF-8 bytes
 * @author teramako teramako.at.gmail.com
 * @version 0.1
 * @license MIT
 */


/**
 * Unicode converter
 * @class
 * @param {String|Number[]} str
 * @param {String} [encode]
 */
const Unicode = Class("Unicode", /** @lends Unicode */ {
  /** @constructs */
  init: function UnicodeInit (str, encode) {
    if (!encode) {
      if (typeof str === "string")
        encode = "";
      else
        encode = "UTF-8";
    }

    if (typeof str === "string")
      Object.defineProperty(this, "value", {
        enumerable: true,
        configurable: true,
        value: str
      });

    switch (encode.toUpperCase()) {
    case "UTF-8":
      if (!(str instanceof Array) && !(str.buffer && str.buffer instanceof ArrayBuffer))
        throw new TypeError("arguments[0] must be an array on UTF-8");
      this.CP = Unicode.toCP(str, "UTF-8");
      break;
    case "UTF-16":
    default:
      this.CP = Unicode.toCP(str, "UTF-16");
      break;
    }
  },
  /**
   * the unicode string
   * @memberof Unicode#
   * @type String
   * @name value
   */
  get value () {
    var str = Unicode.fromCP(this.CP, "string");
    Object.defineProperty(this, "value", {
      enumerable: true,
      configurable: true,
      value: str
    });
    return str;
  },
  /**
   * get UTF-8 bytes array
   * @memberof Unicode#
   * @type Array
   * @name UTF8
   */
  get UTF8 () {
    var bytes = Unicode.fromCP(this.CP, "UTF-8");
    Object.defineProperty(this, "UTF8", {
      enumerable: true,
      configurable: true,
      value: bytes,
    });
    return bytes;
  },
  /**
   * get UTF-16 bytes array
   * @memberof Unicode#
   * @type Array
   * @name UTF16
   */
  get UTF16 () {
    var bytes = Unicode.fromCP(this.CP, "UTF-16");
    Object.defineProperty(this, "UTF16", {
      enumerable: true,
      configurable: true,
      value: bytes,
    });
    return bytes;
  },
  /**
   * returns the field of `value'
   * @methodof Unicode#
   * @return {String}
   * @see Unicode#value
   */
  valueOf: function () {
    return this.value;
  },
  /**
   * return Numberic character referene string
   * @methodof Unicode#
   * @return {String}
   * @example
   * Unicode("あいうえお").toCharacterReference()
   * // "&#x3042;&#x3044;&#x3046;&#x3048;&#x304a;"
   */
  toCharacterReference: function () {
    return this.CP.map(function(n){ return "&#x" + n.toString(16) + ";" }).join("");
  },
  /**
   * returns Unicode escape string
   * @methodof Unicode#
   * @return {String}
   * @example
   * Unicode("あいうえお").toString()
   * // "\\u3042\\u3044\\u3046\\u3048\\u304A"
   */
  toString: function () {
    return this.CP.map(function(n){ return "\\u" + n.toString(16).toUpperCase() }).join("");
  },
});
Object.defineProperties(Unicode, (function(){
  const UTF8_FIRST_BIT = [
    0xC0, // 192(11000000) 2 byte
    0xe0, // 224(11100000) 3 byte
    0xf0  // 240(11110000) 4 byte
  ];
  const BIT_MASK = [
    (1 << 5) -1, // 5bit mask: 00011111
    (1 << 4) -1, // 4bit mask: 00001111
    (1 << 3) -1, // 3bit mask: 00000111
  ];
  /**
   * Unicode符号位置からUTF-8バイト数を返す
   * @param {Number} cp Code point of Unicode
   * @return {Number}
   * @inner
   */
  function getUTF8BytesLength (cp) {
    if (cp < 0x80) // 0 - 0x7F
      return 1;
    else if (cp < 0x000800) // 0x80 - 0x07FF
      return 2;
    else if (cp < 0x010000) // 0x0800 - 0x0FFF
      return 3;
    else if (cp < 0x110000) // 0x01000 - 0x10FFFF
      return 4;

    throw new Error("Invalid");
  }
  /**
   * Unicode符号位置をUTF-8バイト列に
   * @param {Number[]|Number} code Code Point of Unicode
   * @return {Number[]}
   * @inner
   */
  function CPtoUTF8 (cp) {
    if (typeof cp === "number")
      cp = [cp];

    var result = [];
    for (var i = 0, len = cp.length; i < len; ++i) {
      var buf = cp[i];
      //console.log("cp:", buf, "0x"+buf.toString(16), buf.toString(2));
      if (buf < 0x80) {
        result.push(buf);
        continue;
      }
      var count = getUTF8BytesLength(buf),
          bytes = new Array(count);
      for (var j = count -1; j > 0; --j) {
        bytes[j] = (buf & 0x3F) + 0x80;
        buf >>= 6;
      }
      bytes[0] = UTF8_FIRST_BIT[count -2] | buf;
      result.push.apply(result, bytes);
    }
    return result;
  }
  /**
   * Unicode符号位置をUTF-16バイト列に
   * @param {Number[]|Number} code Code Point of Unicode
   * @return {Number[]}
   * @inner
   */
  function CPtoUTF16 (cp) {
    if (typeof cp === "number")
      cp = [cp];

    var result = [], buf;
    for (var i = 0, len = cp.length; i < len; ++i) {
      buf = cp[i];
      if (buf < 0x10000)
        result.push(buf); 
      else if (buf < 0x10FFFF) {
        // サロゲートペアの計算
        buf -= 0x10000;
        result.push(0xD800 | (buf >> 10), 0xDC00 | (buf & 0x03FF));
      } else
        throw new Error("Invalid: out of Unicode range");
    }
    return result;
  }
  /**
   * Convert string to UTF-16 bytes array
   * @param {String} str
   * @return {Uint16Array}
   */
  function StringToUTF16 (str) {
    return new Uint16Array(Array.prototype.map.call(str, function(char, i, self) {
      return self.charCodeAt(i);
    }));
  }
  /**
   * Convert utf16 bytes array to String
   * @param {Number[]} bytes
   * @return {String}
   */
  function UTF16toString (bytes) {
    return String.fromCharCode.apply(null, bytes);
  }
  /**
   * 文字列をUnicode符号位置へ
   * @param {Number[]|Uint16Array|String} str
   * @return {Number[]}
   */
  function UTF16toCP (str) {
    if (typeof str === "string")
      str = StringToUTF16(str);

    var result = [];
    for (var i = 0, len = str.length; i < len; ++i) {
      // String#charCodeAt(n) は UTF-16 の n 番目の数値を返す
      var cp = str[i];
      // 0xD800 ～ 0xD8FF なら上位サロゲートと判断（BMP範囲内ならスルー）
      // 下位サロゲートを得て
      // 上位サロゲートの下位10ビットと下位サロゲートの下位10ビットをつなげる
      // さらに 0x10000を足すと Unicp 符号位置となる
      if (0xD800 <= cp && cp <= 0xD8FF) {
        if (i + 1 < len) {
          var cp2 = str[++i];
          // 下位サロゲート
          if (0xDC00 <= cp2 && cp2 <= 0xDFFF) {
            cp = ((cp & 0x03FF) << 10) + (cp2 & 0x03FF) + 0x10000;
          } else
            throw new Error("Invalid: low surrogate");
        } else
          throw new Error("Invalid: low surrogate is none")
      }
      result.push(cp);
    }
    return result;
  }
  /**
   * Unicode文字をUTF-8バイト列に変換
   * @param {Number[]} bytes
   * @return {Number[]}
   * @inner
   */
  function UTF8toCP (bytes) {
    var result = [];
    out:
    for (var i = 0, len = bytes.length; i < len; ++i) {
      var b = bytes[i];
      if (b < 0x80) {
        result.push(b);
        continue;
      }
      for (var j = 2; j >= 0; --j) {
        if (b >= UTF8_FIRST_BIT[j]) {
          var cp = (b & BIT_MASK[j]) << (6 * (1+j));
          for (var k = 0; k <= j; ++k) {
            if (k + i >= len)
              throw new Error("Invalid");
            cp += (bytes[k + i + 1] & 0x3F) << (6 * (j-k));
          }
          result.push(cp);
          i += j + 1;
          continue out;
        }
      }
      throw new Error("Invalid");
    }
    return result;
  }
  var attrs = {
    /**
     * Unicode文字をUTF-8バイト列に変換
     * @param {String} str
     * @return {Number[]}
     * @methodof Unicode
     * @name toUTF8
     */
    toUTF8: {
      value: function StringToUTF8 (str) { return CPtoUTF8(UTF16toCP(str)); },
    },
    /**
     * UTF-8バイト列をUnicode文字へ変換
     * @param {Number[]} bytes An array of UTF-8 bytes
     * @return {String}
     * @methodof Unicode
     * @name fromUTF8
     */
    fromUTF8: {
      value: function UTF8ToString (bytes) { return UTF16toString(CPtoUTF16(UTF8toCP(bytes))); },
    },
    /**
     * Unicode符号位置へ変換
     * @param {String|Number[]} array
     * @param {String} [type]
     * @return {Number[]}
     * @methodof Unicode
     * @name toCP
     */
    toCP: {
      value: function (array, type) {
        if (!array)
          throw new TypeError("arguments[0] must be specified");

        switch (type) {
        case "UTF-8":
          return UTF8toCP(array);
        case "UTF-16":
        default:
          return UTF16toCP(array);
        }
      }
    },
    /**
     * Unicode符号位置からエンコーディング
     * @param {Number[]} cp
     * @param {String} [type]
     * @methodof Unicode
     * @name fromCP
     */
    fromCP: {
      value: function fromCP (cp, type) {
        switch (type) {
        case "UTF-8":
          return CPtoUTF8(cp);
        case "UTF-16":
          return CPtoUTF16(cp);
        default:
          return UTF16toString(CPtoUTF16(cp));
        }
      },
    },
  };
  return attrs;
})());

/**
 * Unicode converter
 * @namespace
 */
const U = (function() {
  const table = [
    0xC0, // 192(11000000) 2 byte
    0xe0, // 224(11100000) 3 byte
    0xf0  // 240(11110000) 4 byte
  ];
  /**
   * Unicode文字をUTF-8バイト列に変換
   * @param {String} str
   * @return {Number[]}
   * @methodof U
   */
  function toUTF8Octets (str) {
    var result = [];
    /**
     * Unicode符号位置からUTF-8バイト数を返す
     * @param {Number} code
     * @return {Number}
     */
    function getLength (code) {
      if (code < 0x80) // 0 - 0x7F
        return 1;
      else if (code < 0x000800) // 0x80 - 0x07FF
        return 2;
      else if (code < 0x010000) // 0x0800 - 0x0FFF
        return 3;
      else if (code < 0x110000) // 0x01000 - 0x10FFFF
        return 4;

      throw new Error("Invalid");
    }
    /**
     * Unicode符号位置をUTF-8バイト列に
     * @param {Number} code
     * @return {Number[]}
     */
    function charToBytes (code) {
      //console.log("code:", code);
      if (code < 0x80)
        return [code];

      var count = getLength(code),
          bytes = [];
      for (var i = 1; i < count; ++i) {
        var n = code & 0x3F;
        code = code >> 6;
        bytes.unshift(n + 0x80);
      }
      bytes.unshift(table[count-2] | code);
      return bytes;
    }

    //console.log("encode:", encodeURI(str));

    for (var i = 0, len = str.length; i < len; ++i) {
      // String#charCodeAt(n) は UTF-16 の n 番目の数値を返す
      var code = str.charCodeAt(i);
      // 0xD800 ～ 0xD8FF なら上位サロゲートと判断（BMP範囲内ならスルー）
      // 下位サロゲートを得て
      // 上位サロゲートの下位10ビットと下位サロゲートの下位10ビットをつなげる
      // さらに 0x10000を足すと Unicode 符号位置となる
      if (0xD800 <= code && code <= 0xD8FF) {
        if (i + 1 < len) {
          var code2 = str.charCodeAt(i+1);
          // 下位サロゲート
          if (0xDC00 <= code2 && code2 <= 0xDFFF) {
            code = ((code & 0x03FF) << 10) + (code2 & 0x03FF) + 0x10000;
            ++i;
          } else
            throw new Error("Invalid: surrogate 2");
        } else
          throw new Error("Invalid: surrogate 1")
      }
      result.push.apply(result, charToBytes(code));
    }
    return result;
  }

  /**
   * 文字列をUnicode符号位置へ
   * @param {String} str
   * @return {Number[]}
   */
  function toUnicodePoint (str) {
    var res = [];
    for (var i = 0, len = str.length; i < len; ++i) {
      // String#charCodeAt(n) は UTF-16 の n 番目の数値を返す
      var code = str.charCodeAt(i);
      // 0xD800 ～ 0xD8FF なら上位サロゲートと判断（BMP範囲内ならスルー）
      // 下位サロゲートを得て
      // 上位サロゲートの下位10ビットと下位サロゲートの下位10ビットをつなげる
      // さらに 0x10000を足すと Unicode 符号位置となる
      if (0xD800 <= code && code <= 0xD8FF) {
        if (i + 1 < len) {
          var code2 = str.charCodeAt(i+1);
          // 下位サロゲート
          if (0xDC00 <= code2 && code2 <= 0xDFFF) {
            code = ((code & 0x03FF) << 10) + (code2 & 0x03FF) + 0x10000;
            ++i;
          } else
            throw new Error("Invalid: surrogate 2");
        } else
          throw new Error("Invalid: surrogate 1")
      }
      res.push(code);
    }
    return res;
  }

  /**
   * UTF-8バイト列をUnicode文字へ変換
   * @param {Number[]} bytes
   * @return {String}
   * @methodof U
   */
  function fromUTF8Octets (bytes) {
    var res = [];
    out:
    for (var i = 0, len = bytes.length; i < len; ++i) {
      var b = bytes[i];
      if (b < 0x80) {
        res.push(b);
        continue;
      }
      for (var j = 2; j >= 0; --j) {
        if (b >= table[j]) {
          var code = (b & ((0xFE - table[j]) >> 1)) << (6 * (1+j));
          for (var k = 0; k <= j; ++k) {
            if (k + i >= len)
              throw new Error("Invalid");
            code += (bytes[k + i + 1] & 0x3F) << (6 * (j-k));
          }
          if (code < 0x10000) {
            res.push(code);
          }
          else if (code < 0x10FFFF) {
            // サロゲートペアの計算
            code -= 0x10000;
            res.push(0xD800 | (code >> 10), 0xDC00 | (code & 0x03FF));
          }
          else {
            throw new Error("Invalid");
          }
          i += j + 1;
          continue out;
        }
      }
      throw new Error("Invalid");
    }
    return String.fromCharCode.apply(null, res);
  }

  return {
    toUTF8Octets: toUTF8Octets,
    fromUTF8Octets: fromUTF8Octets,
    toUnicodePoint: toUnicodePoint,
  };
})();

// vim: sw=2 ts=2 et:
