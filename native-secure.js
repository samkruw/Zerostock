(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@aparajita/capacitor-secure-storage/node_modules/@capacitor/core/dist/index.js
  var ExceptionCode2, CapacitorException2, getPlatformId2, createCapacitor2, initCapacitorGlobal2, Capacitor2, registerPlugin2, WebPlugin2, encode2, decode2, CapacitorCookiesPluginWeb2, CapacitorCookies2, readBlobAsBase642, normalizeHttpHeaders2, buildUrlParams2, buildRequestInit2, CapacitorHttpPluginWeb2, CapacitorHttp2, SystemBarsStyle2, SystemBarType2, SystemBarsPluginWeb2, SystemBars2;
  var init_dist = __esm({
    "node_modules/@aparajita/capacitor-secure-storage/node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode3) {
        ExceptionCode3["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode3["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode2 || (ExceptionCode2 = {}));
      CapacitorException2 = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId2 = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor2 = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId2(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin3 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException2(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode2.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException2(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode2.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy2 = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy2;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy: proxy2,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy2;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin3;
        cap.Exception = CapacitorException2;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal2 = (win) => win.Capacitor = createCapacitor2(win);
      Capacitor2 = /* @__PURE__ */ initCapacitorGlobal2(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin2 = Capacitor2.registerPlugin;
      WebPlugin2 = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor2.Exception(msg, ExceptionCode2.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor2.Exception(msg, ExceptionCode2.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode2 = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode2 = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb2 = class extends WebPlugin2 {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key2, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key2 = decode2(key2).trim();
            value = decode2(value).trim();
            cookieMap[key2] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode2(options.key);
            const encodedValue = encode2(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies2 = registerPlugin2("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb2()
      });
      readBlobAsBase642 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders2 = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key2, index) => {
          acc[key2] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams2 = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key2, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key2}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key2}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit2 = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders2(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key2, value] of Object.entries(options.data || {})) {
            params.set(key2, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key2) => {
              form.append(key2, value);
            });
          } else {
            for (const key2 of Object.keys(options.data)) {
              form.append(key2, options.data[key2]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb2 = class extends WebPlugin2 {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit2(options, options.webFetchExtra);
          const urlParams = buildUrlParams2(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase642(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key2) => {
            headers[key2] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp2 = registerPlugin2("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb2()
      });
      (function(SystemBarsStyle3) {
        SystemBarsStyle3["Dark"] = "DARK";
        SystemBarsStyle3["Light"] = "LIGHT";
        SystemBarsStyle3["Default"] = "DEFAULT";
      })(SystemBarsStyle2 || (SystemBarsStyle2 = {}));
      (function(SystemBarType3) {
        SystemBarType3["StatusBar"] = "StatusBar";
        SystemBarType3["NavigationBar"] = "NavigationBar";
      })(SystemBarType2 || (SystemBarType2 = {}));
      SystemBarsPluginWeb2 = class extends WebPlugin2 {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars2 = registerPlugin2("SystemBars", {
        web: () => new SystemBarsPluginWeb2()
      });
    }
  });

  // node_modules/@aparajita/capacitor-secure-storage/dist/esm/definitions.js
  var StorageErrorType, KeychainAccess, StorageError;
  var init_definitions = __esm({
    "node_modules/@aparajita/capacitor-secure-storage/dist/esm/definitions.js"() {
      (function(StorageErrorType2) {
        StorageErrorType2["missingKey"] = "missingKey";
        StorageErrorType2["invalidData"] = "invalidData";
        StorageErrorType2["osError"] = "osError";
        StorageErrorType2["unknownError"] = "unknownError";
        StorageErrorType2["missingPrefix"] = "missingPrefix";
      })(StorageErrorType || (StorageErrorType = {}));
      (function(KeychainAccess2) {
        KeychainAccess2[KeychainAccess2["whenUnlocked"] = 0] = "whenUnlocked";
        KeychainAccess2[KeychainAccess2["whenUnlockedThisDeviceOnly"] = 1] = "whenUnlockedThisDeviceOnly";
        KeychainAccess2[KeychainAccess2["afterFirstUnlock"] = 2] = "afterFirstUnlock";
        KeychainAccess2[KeychainAccess2["afterFirstUnlockThisDeviceOnly"] = 3] = "afterFirstUnlockThisDeviceOnly";
        KeychainAccess2[KeychainAccess2["whenPasscodeSetThisDeviceOnly"] = 4] = "whenPasscodeSetThisDeviceOnly";
      })(KeychainAccess || (KeychainAccess = {}));
      StorageError = class extends Error {
        constructor(message, code) {
          super(message);
          this.name = "StorageError";
          this.code = code;
        }
      };
    }
  });

  // node_modules/@aparajita/capacitor-secure-storage/dist/esm/base.js
  function isStorageErrorType(value) {
    return value !== void 0 && Object.keys(StorageErrorType).includes(value);
  }
  function parseISODate(isoDate) {
    const match = isoDateRE.exec(isoDate);
    if (match) {
      const year = Number.parseInt(match[1], 10);
      const month = Number.parseInt(match[2], 10) - 1;
      const day = Number.parseInt(match[3], 10);
      const hour = Number.parseInt(match[4], 10);
      const minute = Number.parseInt(match[5], 10);
      const second = Number.parseInt(match[6], 10);
      const millis = Number.parseInt(match[7], 10);
      const epochTime = Date.UTC(year, month, day, hour, minute, second, millis);
      return new Date(epochTime);
    }
    return null;
  }
  var SecureStorageBase, isoDateRE;
  var init_base = __esm({
    "node_modules/@aparajita/capacitor-secure-storage/dist/esm/base.js"() {
      init_dist();
      init_definitions();
      SecureStorageBase = class _SecureStorageBase extends WebPlugin2 {
        constructor() {
          super(...arguments);
          this.prefix = "capacitor-storage_";
          this.sync = false;
          this.access = KeychainAccess.whenUnlocked;
        }
        async setSynchronize(sync) {
          this.sync = sync;
          if (Capacitor2.getPlatform() === "ios") {
            return this.setSynchronizeKeychain({ sync });
          }
        }
        async getSynchronize() {
          return this.sync;
        }
        async setDefaultKeychainAccess(access) {
          this.access = access;
        }
        async tryOperation(operation) {
          try {
            return await operation();
          } catch (error) {
            if (error instanceof CapacitorException2 && isStorageErrorType(error.code)) {
              throw new StorageError(error.message, error.code);
            }
            throw error;
          }
        }
        async get(key2, convertDate = true, sync) {
          if (key2) {
            const { data } = await this.tryOperation(async () => this.internalGetItem({
              prefixedKey: this.prefixedKey(key2),
              sync: sync !== null && sync !== void 0 ? sync : this.sync
            }));
            if (data === null) {
              return null;
            }
            if (convertDate) {
              const date = parseISODate(data);
              if (date) {
                return date;
              }
            }
            try {
              return JSON.parse(data);
            } catch (_a) {
              throw new StorageError("Invalid data", StorageErrorType.invalidData);
            }
          }
          return _SecureStorageBase.missingKey();
        }
        async getItem(key2) {
          if (key2) {
            const { data } = await this.tryOperation(async () => this.internalGetItem({
              prefixedKey: this.prefixedKey(key2),
              sync: this.sync
            }));
            return data;
          }
          return null;
        }
        async set(key2, data, convertDate = true, sync, access) {
          if (key2) {
            let convertedData = data;
            if (convertDate && data instanceof Date) {
              convertedData = data.toISOString();
            }
            return this.tryOperation(async () => this.internalSetItem({
              prefixedKey: this.prefixedKey(key2),
              data: JSON.stringify(convertedData),
              sync: sync !== null && sync !== void 0 ? sync : this.sync,
              access: access !== null && access !== void 0 ? access : this.access
            }));
          }
          return _SecureStorageBase.missingKey();
        }
        async setItem(key2, value) {
          if (key2) {
            return this.tryOperation(async () => this.internalSetItem({
              prefixedKey: this.prefixedKey(key2),
              data: value,
              sync: this.sync,
              access: this.access
            }));
          }
          return _SecureStorageBase.missingKey();
        }
        async remove(key2, sync) {
          if (key2) {
            const { success } = await this.tryOperation(async () => this.internalRemoveItem({
              prefixedKey: this.prefixedKey(key2),
              sync: sync !== null && sync !== void 0 ? sync : this.sync
            }));
            return success;
          }
          return _SecureStorageBase.missingKey();
        }
        async removeItem(key2) {
          if (key2) {
            await this.tryOperation(async () => this.internalRemoveItem({
              prefixedKey: this.prefixedKey(key2),
              sync: this.sync
            }));
            return;
          }
          _SecureStorageBase.missingKey();
        }
        async clearItemsWithPrefix(options) {
          const prefix = this.checkPrefix(options.prefix);
          await this.tryOperation(async () => this.internalClearItemsWithPrefix({
            prefix,
            sync: this.sync
          }));
        }
        checkPrefix(prefix) {
          if (prefix.trim().length === 0) {
            throw new StorageError("Non-blank prefix provided", StorageErrorType.missingPrefix);
          }
          return prefix;
        }
        async keys(sync) {
          const { keys } = await this.tryOperation(async () => this.internalGetPrefixedKeys({
            prefix: this.prefix,
            sync: sync !== null && sync !== void 0 ? sync : this.sync
          }));
          const prefixLength = this.prefix.length;
          return keys.map((key2) => key2.slice(prefixLength));
        }
        async getKeyPrefix() {
          return this.prefix;
        }
        async setKeyPrefix(prefix) {
          this.prefix = this.checkPrefix(prefix);
        }
        prefixedKey(key2) {
          return this.prefix + key2;
        }
        static missingKey() {
          throw new StorageError("No key provided", StorageErrorType.missingKey);
        }
      };
      isoDateRE = /^"(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z"$/u;
    }
  });

  // node_modules/@aparajita/capacitor-secure-storage/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    SecureStorageWeb: () => SecureStorageWeb
  });
  var SecureStorageWeb;
  var init_web = __esm({
    "node_modules/@aparajita/capacitor-secure-storage/dist/esm/web.js"() {
      init_base();
      SecureStorageWeb = class extends SecureStorageBase {
        // @native
        async setSynchronizeKeychain(_options) {
        }
        // @native
        // eslint-disable-next-line @typescript-eslint/require-await
        async internalGetItem(options) {
          return { data: localStorage.getItem(options.prefixedKey) };
        }
        // @native
        // eslint-disable-next-line @typescript-eslint/require-await
        async internalSetItem(options) {
          localStorage.setItem(options.prefixedKey, options.data);
        }
        // @native
        // eslint-disable-next-line @typescript-eslint/require-await
        async internalRemoveItem(options) {
          const item = localStorage.getItem(options.prefixedKey);
          if (item !== null) {
            localStorage.removeItem(options.prefixedKey);
            return { success: true };
          }
          return { success: false };
        }
        async clear() {
          const { keys } = await this.internalGetPrefixedKeys({ prefix: this.prefix });
          for (const key2 of keys) {
            localStorage.removeItem(key2);
          }
        }
        // @native
        // eslint-disable-next-line @typescript-eslint/require-await
        async internalClearItemsWithPrefix(_options) {
          console.warn("internalClearItemsWithPrefix is native only");
        }
        // @native
        // eslint-disable-next-line @typescript-eslint/require-await
        async internalGetPrefixedKeys(options) {
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key2 = localStorage.key(i);
            if (key2 === null || key2 === void 0 ? void 0 : key2.startsWith(options.prefix)) {
              keys.push(key2);
            }
          }
          return { keys };
        }
      };
    }
  });

  // node_modules/@aparajita/capacitor-secure-storage/dist/esm/native.js
  var native_exports = {};
  __export(native_exports, {
    SecureStorageNative: () => SecureStorageNative
  });
  var SecureStorageNative;
  var init_native = __esm({
    "node_modules/@aparajita/capacitor-secure-storage/dist/esm/native.js"() {
      init_base();
      SecureStorageNative = class extends SecureStorageBase {
        constructor(capProxy) {
          super();
          const proxy2 = capProxy;
          this.setSynchronizeKeychain = proxy2.setSynchronizeKeychain;
          this.internalGetItem = proxy2.internalGetItem;
          this.internalSetItem = proxy2.internalSetItem;
          this.internalRemoveItem = proxy2.internalRemoveItem;
          this.internalClearItemsWithPrefix = proxy2.internalClearItemsWithPrefix;
          this.internalGetPrefixedKeys = proxy2.internalGetPrefixedKeys;
        }
        // @native
        async setSynchronizeKeychain(_options) {
        }
        // @native
        async internalGetItem(_options) {
          return { data: "" };
        }
        // @native
        async internalSetItem(_options) {
        }
        // @native
        async internalRemoveItem(_options) {
          return { success: true };
        }
        async clear(sync) {
          return this.tryOperation(async () => this.clearItemsWithPrefix({
            prefix: this.prefix,
            sync: sync !== null && sync !== void 0 ? sync : this.sync
          }));
        }
        // @native
        async internalClearItemsWithPrefix(_options) {
        }
        // @native
        async internalGetPrefixedKeys(_options) {
          return { keys: [] };
        }
      };
    }
  });

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode;
  (function(ExceptionCode3) {
    ExceptionCode3["Unimplemented"] = "UNIMPLEMENTED";
    ExceptionCode3["Unavailable"] = "UNAVAILABLE";
  })(ExceptionCode || (ExceptionCode = {}));
  var CapacitorException = class extends Error {
    constructor(message, code, data) {
      super(message);
      this.message = message;
      this.code = code;
      this.data = data;
    }
  };
  var getPlatformId = (win) => {
    var _a, _b;
    if (win === null || win === void 0 ? void 0 : win.androidBridge) {
      return "android";
    } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
      return "ios";
    } else {
      return "web";
    }
  };
  var createCapacitor = (win) => {
    const capCustomPlatform = win.CapacitorCustomPlatform || null;
    const cap = win.Capacitor || {};
    const Plugins = cap.Plugins = cap.Plugins || {};
    const getPlatform = () => {
      return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
    };
    const isNativePlatform = () => getPlatform() !== "web";
    const isPluginAvailable = (pluginName) => {
      const plugin = registeredPlugins.get(pluginName);
      if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
        return true;
      }
      if (getPluginHeader(pluginName)) {
        return true;
      }
      return false;
    };
    const getPluginHeader = (pluginName) => {
      var _a;
      return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
    };
    const handleError = (err) => win.console.error(err);
    const registeredPlugins = /* @__PURE__ */ new Map();
    const registerPlugin3 = (pluginName, jsImplementations = {}) => {
      const registeredPlugin = registeredPlugins.get(pluginName);
      if (registeredPlugin) {
        console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
        return registeredPlugin.proxy;
      }
      const platform = getPlatform();
      const pluginHeader = getPluginHeader(pluginName);
      let jsImplementation;
      const loadPluginImplementation = async () => {
        if (!jsImplementation && platform in jsImplementations) {
          jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
        } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
          jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
        }
        return jsImplementation;
      };
      const createPluginMethod = (impl, prop) => {
        var _a, _b;
        if (pluginHeader) {
          const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
          if (methodHeader) {
            if (methodHeader.rtype === "promise") {
              return (options) => cap.nativePromise(pluginName, prop.toString(), options);
            } else {
              return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
            }
          } else if (impl) {
            return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
          }
        } else if (impl) {
          return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
        } else {
          throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
        }
      };
      const createPluginMethodWrapper = (prop) => {
        let remove;
        const wrapper = (...args) => {
          const p = loadPluginImplementation().then((impl) => {
            const fn = createPluginMethod(impl, prop);
            if (fn) {
              const p2 = fn(...args);
              remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
              return p2;
            } else {
              throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          });
          if (prop === "addListener") {
            p.remove = async () => remove();
          }
          return p;
        };
        wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
        Object.defineProperty(wrapper, "name", {
          value: prop,
          writable: false,
          configurable: false
        });
        return wrapper;
      };
      const addListener = createPluginMethodWrapper("addListener");
      const removeListener = createPluginMethodWrapper("removeListener");
      const addListenerNative = (eventName, callback) => {
        const call = addListener({ eventName }, callback);
        const remove = async () => {
          const callbackId = await call;
          removeListener({
            eventName,
            callbackId
          }, callback);
        };
        const p = new Promise((resolve) => call.then(() => resolve({ remove })));
        p.remove = async () => {
          console.warn(`Using addListener() without 'await' is deprecated.`);
          await remove();
        };
        return p;
      };
      const proxy2 = new Proxy({}, {
        get(_, prop) {
          switch (prop) {
            // https://github.com/facebook/react/issues/20030
            case "$$typeof":
              return void 0;
            case "toJSON":
              return () => ({});
            case "addListener":
              return pluginHeader ? addListenerNative : addListener;
            case "removeListener":
              return removeListener;
            default:
              return createPluginMethodWrapper(prop);
          }
        }
      });
      Plugins[pluginName] = proxy2;
      registeredPlugins.set(pluginName, {
        name: pluginName,
        proxy: proxy2,
        platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
      });
      return proxy2;
    };
    if (!cap.convertFileSrc) {
      cap.convertFileSrc = (filePath) => filePath;
    }
    cap.getPlatform = getPlatform;
    cap.handleError = handleError;
    cap.isNativePlatform = isNativePlatform;
    cap.isPluginAvailable = isPluginAvailable;
    cap.registerPlugin = registerPlugin3;
    cap.Exception = CapacitorException;
    cap.DEBUG = !!cap.DEBUG;
    cap.isLoggingEnabled = !!cap.isLoggingEnabled;
    return cap;
  };
  var initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
  var Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
  var registerPlugin = Capacitor.registerPlugin;
  var WebPlugin = class {
    constructor() {
      this.listeners = {};
      this.retainedEventArguments = {};
      this.windowListeners = {};
    }
    addListener(eventName, listenerFunc) {
      let firstListener = false;
      const listeners = this.listeners[eventName];
      if (!listeners) {
        this.listeners[eventName] = [];
        firstListener = true;
      }
      this.listeners[eventName].push(listenerFunc);
      const windowListener = this.windowListeners[eventName];
      if (windowListener && !windowListener.registered) {
        this.addWindowListener(windowListener);
      }
      if (firstListener) {
        this.sendRetainedArgumentsForEvent(eventName);
      }
      const remove = async () => this.removeListener(eventName, listenerFunc);
      const p = Promise.resolve({ remove });
      return p;
    }
    async removeAllListeners() {
      this.listeners = {};
      for (const listener in this.windowListeners) {
        this.removeWindowListener(this.windowListeners[listener]);
      }
      this.windowListeners = {};
    }
    notifyListeners(eventName, data, retainUntilConsumed) {
      const listeners = this.listeners[eventName];
      if (!listeners) {
        if (retainUntilConsumed) {
          let args = this.retainedEventArguments[eventName];
          if (!args) {
            args = [];
          }
          args.push(data);
          this.retainedEventArguments[eventName] = args;
        }
        return;
      }
      listeners.forEach((listener) => listener(data));
    }
    hasListeners(eventName) {
      var _a;
      return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
    }
    registerWindowListener(windowEventName, pluginEventName) {
      this.windowListeners[pluginEventName] = {
        registered: false,
        windowEventName,
        pluginEventName,
        handler: (event) => {
          this.notifyListeners(pluginEventName, event);
        }
      };
    }
    unimplemented(msg = "not implemented") {
      return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
    }
    unavailable(msg = "not available") {
      return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
    }
    async removeListener(eventName, listenerFunc) {
      const listeners = this.listeners[eventName];
      if (!listeners) {
        return;
      }
      const index = listeners.indexOf(listenerFunc);
      if (index !== -1) {
        this.listeners[eventName].splice(index, 1);
      }
      if (!this.listeners[eventName].length) {
        this.removeWindowListener(this.windowListeners[eventName]);
      }
    }
    addWindowListener(handle) {
      window.addEventListener(handle.windowEventName, handle.handler);
      handle.registered = true;
    }
    removeWindowListener(handle) {
      if (!handle) {
        return;
      }
      window.removeEventListener(handle.windowEventName, handle.handler);
      handle.registered = false;
    }
    sendRetainedArgumentsForEvent(eventName) {
      const args = this.retainedEventArguments[eventName];
      if (!args) {
        return;
      }
      delete this.retainedEventArguments[eventName];
      args.forEach((arg) => {
        this.notifyListeners(eventName, arg);
      });
    }
  };
  var encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
  var decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
  var CapacitorCookiesPluginWeb = class extends WebPlugin {
    async getCookies() {
      const cookies = document.cookie;
      const cookieMap = {};
      cookies.split(";").forEach((cookie) => {
        if (cookie.length <= 0)
          return;
        let [key2, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
        key2 = decode(key2).trim();
        value = decode(value).trim();
        cookieMap[key2] = value;
      });
      return cookieMap;
    }
    async setCookie(options) {
      try {
        const encodedKey = encode(options.key);
        const encodedValue = encode(options.value);
        const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
        const path = (options.path || "/").replace("path=", "");
        const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
        document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
      } catch (error) {
        return Promise.reject(error);
      }
    }
    async deleteCookie(options) {
      try {
        document.cookie = `${options.key}=; Max-Age=0`;
      } catch (error) {
        return Promise.reject(error);
      }
    }
    async clearCookies() {
      try {
        const cookies = document.cookie.split(";") || [];
        for (const cookie of cookies) {
          document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    }
    async clearAllCookies() {
      try {
        await this.clearCookies();
      } catch (error) {
        return Promise.reject(error);
      }
    }
  };
  var CapacitorCookies = registerPlugin("CapacitorCookies", {
    web: () => new CapacitorCookiesPluginWeb()
  });
  var readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
  var normalizeHttpHeaders = (headers = {}) => {
    const originalKeys = Object.keys(headers);
    const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
    const normalized = loweredKeys.reduce((acc, key2, index) => {
      acc[key2] = headers[originalKeys[index]];
      return acc;
    }, {});
    return normalized;
  };
  var buildUrlParams = (params, shouldEncode = true) => {
    if (!params)
      return null;
    const output = Object.entries(params).reduce((accumulator, entry) => {
      const [key2, value] = entry;
      let encodedValue;
      let item;
      if (Array.isArray(value)) {
        item = "";
        value.forEach((str) => {
          encodedValue = shouldEncode ? encodeURIComponent(str) : str;
          item += `${key2}=${encodedValue}&`;
        });
        item.slice(0, -1);
      } else {
        encodedValue = shouldEncode ? encodeURIComponent(value) : value;
        item = `${key2}=${encodedValue}`;
      }
      return `${accumulator}&${item}`;
    }, "");
    return output.substr(1);
  };
  var buildRequestInit = (options, extra = {}) => {
    const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
    const headers = normalizeHttpHeaders(options.headers);
    const type = headers["content-type"] || "";
    if (typeof options.data === "string") {
      output.body = options.data;
    } else if (type.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams();
      for (const [key2, value] of Object.entries(options.data || {})) {
        params.set(key2, value);
      }
      output.body = params.toString();
    } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
      const form = new FormData();
      if (options.data instanceof FormData) {
        options.data.forEach((value, key2) => {
          form.append(key2, value);
        });
      } else {
        for (const key2 of Object.keys(options.data)) {
          form.append(key2, options.data[key2]);
        }
      }
      output.body = form;
      const headers2 = new Headers(output.headers);
      headers2.delete("content-type");
      output.headers = headers2;
    } else if (type.includes("application/json") || typeof options.data === "object") {
      output.body = JSON.stringify(options.data);
    }
    return output;
  };
  var CapacitorHttpPluginWeb = class extends WebPlugin {
    /**
     * Perform an Http request given a set of options
     * @param options Options to build the HTTP request
     */
    async request(options) {
      const requestInit = buildRequestInit(options, options.webFetchExtra);
      const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
      const url = urlParams ? `${options.url}?${urlParams}` : options.url;
      const response = await fetch(url, requestInit);
      const contentType = response.headers.get("content-type") || "";
      let { responseType = "text" } = response.ok ? options : {};
      if (contentType.includes("application/json")) {
        responseType = "json";
      }
      let data;
      let blob;
      switch (responseType) {
        case "arraybuffer":
        case "blob":
          blob = await response.blob();
          data = await readBlobAsBase64(blob);
          break;
        case "json":
          data = await response.json();
          break;
        case "document":
        case "text":
        default:
          data = await response.text();
      }
      const headers = {};
      response.headers.forEach((value, key2) => {
        headers[key2] = value;
      });
      return {
        data,
        headers,
        status: response.status,
        url: response.url
      };
    }
    /**
     * Perform an Http GET request given a set of options
     * @param options Options to build the HTTP request
     */
    async get(options) {
      return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
    }
    /**
     * Perform an Http POST request given a set of options
     * @param options Options to build the HTTP request
     */
    async post(options) {
      return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
    }
    /**
     * Perform an Http PUT request given a set of options
     * @param options Options to build the HTTP request
     */
    async put(options) {
      return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
    }
    /**
     * Perform an Http PATCH request given a set of options
     * @param options Options to build the HTTP request
     */
    async patch(options) {
      return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
    }
    /**
     * Perform an Http DELETE request given a set of options
     * @param options Options to build the HTTP request
     */
    async delete(options) {
      return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
    }
  };
  var CapacitorHttp = registerPlugin("CapacitorHttp", {
    web: () => new CapacitorHttpPluginWeb()
  });
  var SystemBarsStyle;
  (function(SystemBarsStyle3) {
    SystemBarsStyle3["Dark"] = "DARK";
    SystemBarsStyle3["Light"] = "LIGHT";
    SystemBarsStyle3["Default"] = "DEFAULT";
  })(SystemBarsStyle || (SystemBarsStyle = {}));
  var SystemBarType;
  (function(SystemBarType3) {
    SystemBarType3["StatusBar"] = "StatusBar";
    SystemBarType3["NavigationBar"] = "NavigationBar";
  })(SystemBarType || (SystemBarType = {}));
  var SystemBarsPluginWeb = class extends WebPlugin {
    async setStyle() {
      this.unavailable("not available for web");
    }
    async setAnimation() {
      this.unavailable("not available for web");
    }
    async show() {
      this.unavailable("not available for web");
    }
    async hide() {
      this.unavailable("not available for web");
    }
  };
  var SystemBars = registerPlugin("SystemBars", {
    web: () => new SystemBarsPluginWeb()
  });

  // node_modules/@aparajita/capacitor-secure-storage/dist/esm/index.js
  init_dist();
  init_definitions();
  var proxy = registerPlugin2("SecureStorage", {
    web: async () => {
      const module = await Promise.resolve().then(() => (init_web(), web_exports));
      return new module.SecureStorageWeb();
    },
    ios: async () => {
      const module = await Promise.resolve().then(() => (init_native(), native_exports));
      return new module.SecureStorageNative(proxy);
    },
    android: async () => {
      const module = await Promise.resolve().then(() => (init_native(), native_exports));
      return new module.SecureStorageNative(proxy);
    }
  });

  // src/native-secure.js
  var PREFIX = "zerostock.user.";
  var isNative = () => Capacitor.isNativePlatform?.() && Capacitor.getPlatform?.() === "android";
  var key = (uid) => `${PREFIX}${String(uid || "").trim()}`;
  async function setUser(user = {}) {
    if (!isNative() || !user.uid) return false;
    const safe = { uid: String(user.uid), name: String(user.name || ""), email: String(user.email || ""), role: String(user.role || ""), active: user.active !== false, cachedAt: Date.now() };
    await proxy.set(key(user.uid), safe);
    return true;
  }
  async function getUser(uid) {
    if (!isNative() || !uid) return null;
    try {
      return await proxy.get(key(uid)) || null;
    } catch {
      return null;
    }
  }
  async function removeUser(uid) {
    if (!isNative() || !uid) return false;
    try {
      return await proxy.remove(key(uid));
    } catch {
      return false;
    }
  }
  globalThis.ZeroStockSecure = { isNative, setUser, getUser, removeUser };
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
