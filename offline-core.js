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

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
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
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
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
          const proxy = new Proxy({}, {
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
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
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
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
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
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
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
      CapacitorHttpPluginWeb = class extends WebPlugin {
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
          response.headers.forEach((value, key) => {
            headers[key] = value;
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
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
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
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor-community/sqlite/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    CapacitorSQLiteWeb: () => CapacitorSQLiteWeb
  });
  var CapacitorSQLiteWeb;
  var init_web = __esm({
    "node_modules/@capacitor-community/sqlite/dist/esm/web.js"() {
      init_dist();
      CapacitorSQLiteWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.jeepSqliteElement = null;
          this.isWebStoreOpen = false;
        }
        async initWebStore() {
          await customElements.whenDefined("jeep-sqlite");
          this.jeepSqliteElement = document.querySelector("jeep-sqlite");
          this.ensureJeepSqliteIsAvailable();
          this.jeepSqliteElement.addEventListener("jeepSqliteImportProgress", (event) => {
            this.notifyListeners("sqliteImportProgressEvent", event.detail);
          });
          this.jeepSqliteElement.addEventListener("jeepSqliteExportProgress", (event) => {
            this.notifyListeners("sqliteExportProgressEvent", event.detail);
          });
          this.jeepSqliteElement.addEventListener("jeepSqliteHTTPRequestEnded", (event) => {
            this.notifyListeners("sqliteHTTPRequestEndedEvent", event.detail);
          });
          this.jeepSqliteElement.addEventListener("jeepSqlitePickDatabaseEnded", (event) => {
            this.notifyListeners("sqlitePickDatabaseEndedEvent", event.detail);
          });
          this.jeepSqliteElement.addEventListener("jeepSqliteSaveDatabaseToDisk", (event) => {
            this.notifyListeners("sqliteSaveDatabaseToDiskEvent", event.detail);
          });
          if (!this.isWebStoreOpen) {
            this.isWebStoreOpen = await this.jeepSqliteElement.isStoreOpen();
          }
          return;
        }
        async saveToStore(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.saveToStore(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getFromLocalDiskToStore(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.getFromLocalDiskToStore(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async saveToLocalDisk(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.saveToLocalDisk(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async echo(options) {
          this.ensureJeepSqliteIsAvailable();
          const echoResult = await this.jeepSqliteElement.echo(options);
          return echoResult;
        }
        async createConnection(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.createConnection(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async open(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.open(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async closeConnection(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.closeConnection(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getVersion(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const versionResult = await this.jeepSqliteElement.getVersion(options);
            return versionResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async checkConnectionsConsistency(options) {
          this.ensureJeepSqliteIsAvailable();
          try {
            const consistencyResult = await this.jeepSqliteElement.checkConnectionsConsistency(options);
            return consistencyResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async close(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.close(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async beginTransaction(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const changes = await this.jeepSqliteElement.beginTransaction(options);
            return changes;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async commitTransaction(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const changes = await this.jeepSqliteElement.commitTransaction(options);
            return changes;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async rollbackTransaction(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const changes = await this.jeepSqliteElement.rollbackTransaction(options);
            return changes;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isTransactionActive(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const result = await this.jeepSqliteElement.isTransactionActive(options);
            return result;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getTableList(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const tableListResult = await this.jeepSqliteElement.getTableList(options);
            return tableListResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async execute(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const executeResult = await this.jeepSqliteElement.execute(options);
            return executeResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async executeSet(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const executeResult = await this.jeepSqliteElement.executeSet(options);
            return executeResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async run(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const runResult = await this.jeepSqliteElement.run(options);
            return runResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async query(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const queryResult = await this.jeepSqliteElement.query(options);
            return queryResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isDBExists(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const dbExistsResult = await this.jeepSqliteElement.isDBExists(options);
            return dbExistsResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isDBOpen(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const isDBOpenResult = await this.jeepSqliteElement.isDBOpen(options);
            return isDBOpenResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isDatabase(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const isDatabaseResult = await this.jeepSqliteElement.isDatabase(options);
            return isDatabaseResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isTableExists(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const tableExistsResult = await this.jeepSqliteElement.isTableExists(options);
            return tableExistsResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async deleteDatabase(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.deleteDatabase(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isJsonValid(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const isJsonValidResult = await this.jeepSqliteElement.isJsonValid(options);
            return isJsonValidResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async importFromJson(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const importFromJsonResult = await this.jeepSqliteElement.importFromJson(options);
            return importFromJsonResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async exportToJson(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const exportToJsonResult = await this.jeepSqliteElement.exportToJson(options);
            return exportToJsonResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async createSyncTable(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const createSyncTableResult = await this.jeepSqliteElement.createSyncTable(options);
            return createSyncTableResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async setSyncDate(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.setSyncDate(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getSyncDate(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const getSyncDateResult = await this.jeepSqliteElement.getSyncDate(options);
            return getSyncDateResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async deleteExportedRows(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.deleteExportedRows(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async addUpgradeStatement(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.addUpgradeStatement(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async copyFromAssets(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.copyFromAssets(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getFromHTTPRequest(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.getFromHTTPRequest(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getDatabaseList() {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const databaseListResult = await this.jeepSqliteElement.getDatabaseList();
            return databaseListResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        /**
         * Checks if the `jeep-sqlite` element is present in the DOM.
         * If it's not in the DOM, this method throws an Error.
         *
         * Attention: This will always fail, if the `intWebStore()` method wasn't called before.
         */
        ensureJeepSqliteIsAvailable() {
          if (this.jeepSqliteElement === null) {
            throw new Error(`The jeep-sqlite element is not present in the DOM! Please check the @capacitor-community/sqlite documentation for instructions regarding the web platform.`);
          }
        }
        ensureWebstoreIsOpen() {
          if (!this.isWebStoreOpen) {
            throw new Error('WebStore is not open yet. You have to call "initWebStore()" first.');
          }
        }
        ////////////////////////////////////
        ////// UNIMPLEMENTED METHODS
        ////////////////////////////////////
        async getUrl() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getMigratableDbList(options) {
          console.log("getMigratableDbList", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async addSQLiteSuffix(options) {
          console.log("addSQLiteSuffix", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteOldDatabases(options) {
          console.log("deleteOldDatabases", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async moveDatabasesAndAddSuffix(options) {
          console.log("moveDatabasesAndAddSuffix", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async isSecretStored() {
          throw this.unimplemented("Not implemented on web.");
        }
        async setEncryptionSecret(options) {
          console.log("setEncryptionSecret", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async changeEncryptionSecret(options) {
          console.log("changeEncryptionSecret", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async clearEncryptionSecret() {
          console.log("clearEncryptionSecret");
          throw this.unimplemented("Not implemented on web.");
        }
        async checkEncryptionSecret(options) {
          console.log("checkEncryptionPassPhrase", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async getNCDatabasePath(options) {
          console.log("getNCDatabasePath", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async createNCConnection(options) {
          console.log("createNCConnection", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async closeNCConnection(options) {
          console.log("closeNCConnection", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async isNCDatabase(options) {
          console.log("isNCDatabase", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async isDatabaseEncrypted(options) {
          console.log("isDatabaseEncrypted", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async isInConfigEncryption() {
          throw this.unimplemented("Not implemented on web.");
        }
        async isInConfigBiometricAuth() {
          throw this.unimplemented("Not implemented on web.");
        }
        async loadExtension(options) {
          console.log("loadExtension", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async enableLoadExtension(options) {
          console.log("enableLoadExtension", options);
          throw this.unimplemented("Not implemented on web.");
        }
      };
    }
  });

  // src/offline-core.js
  init_dist();

  // node_modules/@capacitor-community/sqlite/dist/esm/index.js
  init_dist();
  var CapacitorSQLite = registerPlugin("CapacitorSQLite", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.CapacitorSQLiteWeb()),
    electron: () => window.CapacitorCustomPlatform.plugins.CapacitorSQLite
  });

  // src/container-serials.mjs
  function invalid(message) {
    const error = new Error(message);
    error.code = "INVALID_CONTAINER_SERIAL";
    throw error;
  }
  function parseSerialNumbers(input) {
    const list = typeof input === "string" ? input.split(/\r\n|[\r\n]/).filter((line) => line.trim()) : input;
    if (!Array.isArray(list) || !list.length) invalid("Mindestens eine Seriennummer vom Containeretikett erfassen.");
    const seen = /* @__PURE__ */ new Set();
    for (const value of list) {
      if (typeof value !== "string") invalid("Seriennummern als Text erfassen.");
      const number = value.trim();
      if (!number || number.length > 120 || /[\x00-\x1f\x7f]/.test(number) || /[\uD800-\uDFFF]/u.test(number)) {
        invalid("Je Zeile eine Seriennummer mit h\xF6chstens 120 Zeichen erfassen.");
      }
      if (seen.has(number)) invalid("Seriennummer mehrfach erfasst: " + number);
      seen.add(number);
    }
    return [...seen];
  }
  function unitKey(number) {
    const bytes = new TextEncoder().encode(number);
    return "s" + Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  function unitRevision(unit) {
    if (!unit) return "new";
    return unit.moveId ? "move:" + unit.moveId : "assigned:" + unit.updatedAt;
  }
  function serialOrigins(article, numbers) {
    return numbers.map((number) => unitRevision(article.containerUnits?.[unitKey(number)]));
  }
  function inStock(article) {
    return Object.values(article.containerUnits || {}).filter((unit) => unit.status === "in").length;
  }
  function unassignedStock(article) {
    return Number(article.stock) - inStock(article);
  }
  function updateUnits(article, numbers, action, move) {
    if (article.kind !== "container") invalid("Seriennummern geh\xF6ren zu Containerartikeln.");
    const units = { ...article.containerUnits };
    for (const [index, number] of numbers.entries()) {
      const key = unitKey(number), previous = units[key];
      if (move.serialOrigins && move.serialOrigins[index] !== unitRevision(previous)) {
        invalid("Der Zustand wurde zwischenzeitlich ge\xE4ndert. Etikett und Bestand pr\xFCfen: " + number);
      }
      if (action === "assign" && previous) invalid("Seriennummer bereits zugeordnet: " + number);
      if (action === "in" && previous?.status === "in") invalid("Container bereits im Lager: " + number);
      if ((action === "out" || action === "shrink") && previous?.status !== "in") {
        invalid("F\xFCr diese Seriennummer ist kein Container im Lager zugeordnet: " + number);
      }
      units[key] = {
        number,
        status: action === "assign" ? "in" : action,
        updatedAt: move.ts,
        ...move.id ? { moveId: move.id } : {},
        ...move.partner ? { partner: move.partner } : {},
        ...move.reference ? { reference: move.reference } : {}
      };
    }
    const updated = { ...article, containerUnits: units };
    updated.serialStock = inStock(updated);
    return updated;
  }
  function applyStockMovement(article, move) {
    const qty = Number(move.qty), current = Number(article.stock);
    const stock = current + (move.type === "in" ? qty : -qty);
    if (!["in", "out", "shrink"].includes(move.type) || !Number.isSafeInteger(qty) || qty <= 0 || !Number.isSafeInteger(current) || current < 0 || !Number.isSafeInteger(stock)) throw Error("INVALID_STOCK");
    if (stock < 0) throw Error("INSUFFICIENT_STOCK_SERVER");
    let result = article;
    if (move.serialNumbers !== void 0) {
      const numbers = parseSerialNumbers(move.serialNumbers);
      if (numbers.length !== qty) invalid("Die Buchungsmenge muss der Anzahl Etiketten entsprechen.");
      result = updateUnits(article, numbers, move.type, move);
    } else if (article.containerUnits && move.type !== "in" && qty > unassignedStock(article)) {
      invalid("F\xFCr diesen Bestand ist eine Buchung mit Seriennummern erforderlich.");
    }
    return { ...result, stock };
  }

  // src/articles.mjs
  var ARTICLE_KINDS = Object.freeze(["carton", "plate", "container"]);
  var messages = {
    INVALID_KIND: "Bitte eine g\xFCltige Artikelart w\xE4hlen.",
    INVALID_BOOKING: "Die Buchungsdaten sind ung\xFCltig. Bitte Menge und Textfelder pr\xFCfen.",
    IMMUTABLE_ARTICLE: "Die Artikelnummer kann nach dem Anlegen nicht ge\xE4ndert werden.",
    IMMUTABLE_KIND: "Die bereits festgelegte Artikelart kann nicht ge\xE4ndert werden.",
    REQUIRED_TEXT: "Artikelnummer, Bezeichnung und Lagerplatz sind erforderlich.",
    INVALID_TEXT: "Ein Textfeld ist ung\xFCltig oder zu lang.",
    INVALID_QUANTITY: "Mengen m\xFCssen sichere ganze Zahlen ab null sein.",
    INVALID_THRESHOLDS: "Der Warnbestand muss mindestens dem Mindestbestand entsprechen.",
    INVALID_ORDER: "Die gew\xFCnschte Anzahl muss eine positive ganze Zahl sein.",
    INVALID_CONTAINER: "Bitte einen vorhandenen, aktiven Containerartikel w\xE4hlen.",
    INVALID_PLATE: "Eine Plate-Komponente fehlt, ist inaktiv oder hat eine andere Artikelart.",
    EMPTY_COMPONENTS: "Mindestens eine Plate-Komponente ist erforderlich.",
    DUPLICATE_COMPONENT: "Jeder Plate-Artikel darf nur einmal vorkommen.",
    INVALID_COMPONENT: "Jede Plate-Menge muss eine positive ganze Zahl sein.",
    INVALID_CONFIGURATION: "Die Container-Konfiguration ist ung\xFCltig. Bitte pr\xFCfen und erneut speichern.",
    QUANTITY_OVERFLOW: "Die angefragte Menge ist zu gross f\xFCr eine sichere Berechnung."
  };
  function fail(code) {
    const error = new Error(messages[code]);
    error.code = code;
    throw error;
  }
  function text(value, maximum, required = false) {
    if (value == null) value = "";
    if (typeof value !== "string") fail("INVALID_TEXT");
    const result = value.trim();
    if (result.length > maximum) fail("INVALID_TEXT");
    if (required && !result) fail("REQUIRED_TEXT");
    return result;
  }
  function whole(value, positive = false, code = "INVALID_QUANTITY") {
    if (typeof value === "string" && !value.trim()) fail(code);
    if (!["string", "number"].includes(typeof value)) fail(code);
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n < (positive ? 1 : 0)) fail(code);
    return n;
  }
  function articleKind(article) {
    if (article?.kind == null || article.kind === "") return "carton";
    return ARTICLE_KINDS.includes(article.kind) ? article.kind : "unknown";
  }
  function movementMetadata(record = {}) {
    const result = {};
    if (record.articleKind != null) {
      if (!ARTICLE_KINDS.includes(record.articleKind)) fail("INVALID_KIND");
      result.articleKind = record.articleKind;
    }
    for (const [key, maximum] of [["externalRef", 120], ["partner", 120], ["reference", 200]]) {
      if (record[key] == null) continue;
      const value = text(record[key], maximum);
      if (value || key === "externalRef") result[key] = value;
    }
    if (record.serialNumbers !== void 0) {
      if (record.articleKind !== "container") fail("INVALID_BOOKING");
      result.serialNumbers = parseSerialNumbers(record.serialNumbers);
      if (record.serialOrigins !== void 0) {
        if (!Array.isArray(record.serialOrigins) || record.serialOrigins.length !== result.serialNumbers.length || record.serialOrigins.some((value) => typeof value !== "string" || !value || value.length > 200)) fail("INVALID_BOOKING");
        result.serialOrigins = [...record.serialOrigins];
      }
    }
    return result;
  }
  function createMovementMetadata(article, options = {}) {
    const numbers = articleKind(article) === "container" ? parseSerialNumbers(options.serialNumbers) : options.serialNumbers;
    const metadata = movementMetadata({
      articleKind: articleKind(article),
      externalRef: article.externalRef || "",
      partner: options.partner,
      reference: options.reference,
      serialNumbers: numbers
    });
    if (metadata.serialNumbers) metadata.serialOrigins = serialOrigins(article, metadata.serialNumbers);
    return metadata;
  }
  function validateMovement(move) {
    if (!["in", "out", "shrink"].includes(move.type)) fail("INVALID_BOOKING");
    const metadata = movementMetadata(move), qty = whole(move.qty, true, "INVALID_BOOKING");
    if (metadata.serialNumbers && metadata.serialNumbers.length !== qty) fail("INVALID_BOOKING");
    return {
      ...move,
      ...metadata,
      qty,
      cartonId: text(move.cartonId, 120, true),
      article: text(move.article, 120, true),
      userId: text(move.userId, 128, true),
      userName: text(move.userName, 120),
      reason: text(move.reason, 500),
      note: text(move.note, 1e3)
    };
  }
  function sameMovementIdentity(a, b) {
    return a.userId === b.userId && a.cartonId === b.cartonId && a.type === b.type && Number(a.qty) === Number(b.qty) && ["articleKind", "externalRef", "partner", "reference"].every((key) => (a[key] ?? "") === (b[key] ?? "")) && JSON.stringify(a.serialNumbers ?? null) === JSON.stringify(b.serialNumbers ?? null) && JSON.stringify(a.serialOrigins ?? null) === JSON.stringify(b.serialOrigins ?? null);
  }
  function serialDependencies(move) {
    return (move.serialNumbers || []).map((number) => JSON.stringify([move.cartonId, number]));
  }

  // src/offline-core.js
  var DB = "zerostock";
  var DB_VERSION = 3;
  var ready = false;
  function native() {
    return Capacitor.isNativePlatform();
  }
  function now() {
    return Date.now();
  }
  function uuid() {
    return globalThis.crypto?.randomUUID?.() || `zs-${now()}-${Math.random().toString(16).slice(2)}`;
  }
  async function run(statement, values = []) {
    return CapacitorSQLite.run({ database: DB, statement, values, transaction: false });
  }
  async function query(statement, values = []) {
    const out = await CapacitorSQLite.query({ database: DB, statement, values });
    return out?.values || [];
  }
  async function execute(statements) {
    return CapacitorSQLite.execute({ database: DB, statements, transaction: true });
  }
  async function init() {
    if (!native()) return { available: false, reason: "web" };
    if (ready) return { available: true };
    try {
      await CapacitorSQLite.createConnection({ database: DB, version: DB_VERSION, encrypted: false, mode: "no-encryption", readonly: false });
    } catch (e) {
      if (!/already|exist|connection/i.test(String(e?.message || e))) throw e;
    }
    await CapacitorSQLite.open({ database: DB });
    await execute(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cartons (
      id TEXT PRIMARY KEY NOT NULL,
      article TEXT NOT NULL,
      name TEXT,
      location TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 0,
      warn_stock INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      server_updated_at INTEGER NOT NULL DEFAULT 0,
      local_updated_at INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_cartons_article ON cartons(article);
    CREATE TABLE IF NOT EXISTS instructions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY NOT NULL,
      server_id TEXT,
      ts INTEGER NOT NULL,
      user_id TEXT,
      user_name TEXT,
      carton_id TEXT NOT NULL,
      article TEXT,
      type TEXT NOT NULL,
      qty INTEGER NOT NULL,
      reason TEXT,
      note TEXT,
      stock_before INTEGER,
      stock_after INTEGER,
      sync_status TEXT NOT NULL DEFAULT 'PENDING',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      payload_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_movements_ts ON movements(ts DESC);
    CREATE INDEX IF NOT EXISTS idx_movements_sync ON movements(sync_status);
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      next_retry_at INTEGER NOT NULL DEFAULT 0,
      last_attempt_at INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, next_retry_at, created_at);
    CREATE TABLE IF NOT EXISTS users_cache (
      uid TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      email TEXT,
      role TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      cached_at INTEGER NOT NULL,
      payload_json TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      source_key TEXT UNIQUE,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'OPEN',
      reference_id TEXT,
      title TEXT NOT NULL,
      detail TEXT,
      action TEXT,
      icon TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      resolved_at INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status,priority,updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category,status);
  `);
    for (const stmt of [
      `ALTER TABLE sync_queue ADD COLUMN next_retry_at INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE sync_queue ADD COLUMN last_attempt_at INTEGER NOT NULL DEFAULT 0`
    ]) {
      try {
        await run(stmt);
      } catch (e) {
        if (!/duplicate column/i.test(String(e?.message || e))) console.warn("ZeroStock migration", e);
      }
    }
    await run(`UPDATE sync_queue SET status='PENDING',updated_at=? WHERE status='SYNCING'`, [now()]);
    await run(`UPDATE movements SET sync_status='PENDING',updated_at=? WHERE sync_status='SYNCING'`, [now()]);
    await run(`INSERT OR REPLACE INTO metadata(key,value,updated_at) VALUES(?,?,?)`, ["schema_version", String(DB_VERSION), now()]);
    ready = true;
    return { available: true };
  }
  var stockWrites = Promise.resolve();
  function serializeStockWrite(operation) {
    const result = stockWrites.then(operation);
    stockWrites = result.catch(() => {
    });
    return result;
  }
  async function cacheCartons(cartons = []) {
    return serializeStockWrite(() => cacheCartonSnapshot(cartons));
  }
  async function cacheCartonSnapshot(cartons) {
    await init();
    const rows = await query(`SELECT id,carton_id,type,qty,payload_json FROM movements
    WHERE sync_status IN ('PENDING','SYNCING','FAILED') ORDER BY created_at,rowid`);
    const pending = /* @__PURE__ */ new Map();
    for (const row of rows) {
      const list = pending.get(row.carton_id) || [];
      list.push({ ...safeJson(row.payload_json), id: row.id, type: row.type, qty: row.qty });
      pending.set(row.carton_id, list);
    }
    for (const server of cartons) {
      const id = String(server.id || "");
      if (!id) continue;
      let c = server;
      for (const move of pending.get(id) || []) {
        if (server._zsApplied?.[move.id]) continue;
        try {
          c = applyStockMovement(c, move);
        } catch (error) {
          if (error.code !== "INVALID_CONTAINER_SERIAL" && !/INSUFFICIENT_STOCK|INVALID_STOCK/.test(error.message)) throw error;
        }
      }
      await run(
        `INSERT INTO cartons(id,article,name,location,stock,min_stock,warn_stock,active,server_updated_at,local_updated_at,payload_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET article=excluded.article,name=excluded.name,location=excluded.location,
      stock=excluded.stock,min_stock=excluded.min_stock,warn_stock=excluded.warn_stock,active=excluded.active,
      server_updated_at=excluded.server_updated_at,local_updated_at=excluded.local_updated_at,payload_json=excluded.payload_json`,
        [id, String(c.article || id), String(c.name || ""), String(c.location || ""), c.stock, Number(c.min) || 0, Number(c.warn) || 0, c.active === false ? 0 : 1, Number(c.updatedAt) || 0, now(), JSON.stringify(c)]
      );
    }
    const present = new Set(cartons.map((c) => String(c.id)));
    for (const row of await query("SELECT id FROM cartons")) {
      if (!present.has(String(row.id))) await run("DELETE FROM cartons WHERE id=?", [row.id]);
    }
    await run(`INSERT OR REPLACE INTO metadata(key,value,updated_at) VALUES(?,?,?)`, ["cartons_cached_at", String(now()), now()]);
    return getCartons();
  }
  async function getCartons() {
    await init();
    const rows = await query(`SELECT * FROM cartons ORDER BY article COLLATE NOCASE`);
    return rows.map((r) => ({
      ...safeJson(r.payload_json) || {},
      id: r.id,
      article: r.article,
      name: r.name || "",
      location: r.location || "",
      stock: Number(r.stock) || 0,
      min: Number(r.min_stock) || 0,
      warn: Number(r.warn_stock) || 0,
      active: Number(r.active) !== 0,
      updatedAt: Number(r.server_updated_at) || 0
    }));
  }
  async function cacheInstructions(items = []) {
    await init();
    for (const i of items) {
      const id = String(i.id || "");
      if (!id) continue;
      await run(
        `INSERT INTO instructions(id,name,active,updated_at,payload_json) VALUES(?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,active=excluded.active,updated_at=excluded.updated_at,payload_json=excluded.payload_json`,
        [id, String(i.name || ""), i.active === false ? 0 : 1, Number(i.updatedAt) || now(), JSON.stringify(i)]
      );
    }
    const present = new Set(items.map((i) => String(i.id)));
    for (const row of await query("SELECT id FROM instructions")) {
      if (!present.has(String(row.id))) await run("DELETE FROM instructions WHERE id=?", [row.id]);
    }
    return getInstructions();
  }
  async function getInstructions() {
    await init();
    const rows = await query(`SELECT payload_json,id,name,active,updated_at FROM instructions ORDER BY name COLLATE NOCASE`);
    return rows.map((r) => ({ ...safeJson(r.payload_json), id: r.id, name: r.name || "", active: Number(r.active) !== 0, updatedAt: Number(r.updated_at) || 0 }));
  }
  function cacheMovements(items = []) {
    return serializeStockWrite(() => cacheMovementSnapshot(items));
  }
  async function cacheMovementSnapshot(items) {
    await init();
    for (const m of items) {
      const sid = String(m.id || "");
      if (!sid) continue;
      const existing = await query(`SELECT id,payload_json FROM movements WHERE id=? LIMIT 1`, [sid]);
      if (existing.length && !sameMovementIdentity(safeJson(existing[0].payload_json), m)) {
        await markConflict(sid, "ID_COLLISION_OR_MOVEMENT_MISMATCH");
        existing.length = 0;
      }
      const localId = existing.length ? sid : `server:${sid}`;
      await run(
        `INSERT INTO movements(id,server_id,ts,user_id,user_name,carton_id,article,type,qty,reason,note,stock_before,stock_after,sync_status,created_at,updated_at,payload_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'SYNCED',?,?,?)
      ON CONFLICT(id) DO UPDATE SET server_id=excluded.server_id,ts=excluded.ts,user_id=excluded.user_id,user_name=excluded.user_name,carton_id=excluded.carton_id,
      article=excluded.article,type=excluded.type,qty=excluded.qty,reason=excluded.reason,note=excluded.note,stock_after=excluded.stock_after,
      sync_status='SYNCED',updated_at=excluded.updated_at,payload_json=excluded.payload_json`,
        [localId, sid, Number(m.ts) || now(), String(m.userId || ""), String(m.userName || ""), String(m.cartonId || ""), String(m.article || ""), String(m.type || ""), Number(m.qty) || 0, String(m.reason || ""), String(m.note || ""), null, Number(m.stockAfter) || 0, now(), now(), JSON.stringify(m)]
      );
      if (existing.length) {
        await run(`UPDATE sync_queue SET status='SYNCED',last_error=NULL,updated_at=? WHERE id=?`, [now(), sid]);
      }
    }
    return getMovements();
  }
  async function getMovements(limit = 200) {
    await init();
    const rows = await query(`SELECT * FROM movements ORDER BY ts DESC LIMIT ?`, [Number(limit) || 200]);
    return rows.map((r) => ({
      ...safeJson(r.payload_json) || {},
      id: r.id,
      serverId: r.server_id || void 0,
      ts: Number(r.ts) || 0,
      userId: r.user_id || "",
      userName: r.user_name || "",
      cartonId: r.carton_id,
      article: r.article || "",
      type: r.type,
      qty: Number(r.qty) || 0,
      reason: r.reason || "",
      note: r.note || "",
      stockBefore: r.stock_before == null ? void 0 : Number(r.stock_before),
      stockAfter: Number(r.stock_after) || 0,
      syncStatus: r.sync_status
    }));
  }
  function recordMovement(input) {
    return serializeStockWrite(() => recordLocalMovement(input));
  }
  async function recordLocalMovement({ cartonId, type, qty, reason = "", note = "", userId = "", userName = "", partner = "", reference = "", serialNumbers }) {
    await init();
    await CapacitorSQLite.beginTransaction({ database: DB });
    try {
      const rows = await query("SELECT * FROM cartons WHERE id=? LIMIT 1", [String(cartonId)]);
      const c = rows[0];
      if (!c) throw Error("CARTON_NOT_FOUND_OFFLINE");
      const before = Number(c.stock), article = { ...safeJson(c.payload_json), stock: before };
      const id = uuid(), ts = now();
      const metadata = createMovementMetadata(article, { partner, reference, serialNumbers });
      const payload = validateMovement({ id, ts, cartonId: String(cartonId), article: c.article, type, qty, reason, note, userId, userName, stockBefore: before, syncStatus: "PENDING", ...metadata });
      const updated = applyStockMovement(article, payload), after = updated.stock, q = payload.qty;
      payload.stockAfter = after;
      await run("UPDATE cartons SET stock=?,payload_json=?,local_updated_at=? WHERE id=?", [after, JSON.stringify(updated), ts, String(cartonId)]);
      await run(`INSERT INTO movements(id,ts,user_id,user_name,carton_id,article,type,qty,reason,note,stock_before,stock_after,sync_status,created_at,updated_at,payload_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id, ts, userId, userName, String(cartonId), c.article, type, q, reason, note, before, after, "PENDING", ts, ts, JSON.stringify(payload)]);
      await run(`INSERT INTO sync_queue(id,entity_type,entity_id,operation,payload_json,status,attempts,created_at,updated_at)
      VALUES(?,?,?,?,?,'PENDING',0,?,?)`, [id, "movement", id, "CREATE", JSON.stringify(payload), ts, ts]);
      await CapacitorSQLite.commitTransaction({ database: DB });
      return payload;
    } catch (e) {
      try {
        await CapacitorSQLite.rollbackTransaction({ database: DB });
      } catch {
      }
      throw e;
    }
  }
  async function getPendingMovements() {
    await init();
    return getMovementsByStatus(["PENDING", "FAILED", "CONFLICT"]);
  }
  async function getMovementsByStatus(statuses = []) {
    if (!statuses.length) return [];
    const marks = statuses.map(() => "?").join(",");
    const rows = await query(`SELECT * FROM movements WHERE sync_status IN (${marks}) ORDER BY created_at,rowid`, statuses);
    return rows.map((r) => ({ ...movementMetadata(safeJson(r.payload_json) || {}), id: r.id, ts: Number(r.ts) || 0, userId: r.user_id || "", userName: r.user_name || "", cartonId: r.carton_id, article: r.article || "", type: r.type, qty: Number(r.qty) || 0, reason: r.reason || "", note: r.note || "", stockBefore: Number(r.stock_before) || 0, stockAfter: Number(r.stock_after) || 0, syncStatus: r.sync_status }));
  }
  async function getSyncBatch(limit = 20, userId = null) {
    await init();
    const t = now();
    const rows = await query(`SELECT q.*,m.ts,m.user_id,m.user_name,m.carton_id,m.article,m.type,m.qty,m.reason,m.note,m.stock_before,m.stock_after,m.sync_status
    FROM sync_queue q JOIN movements m ON m.id=q.entity_id
    WHERE q.entity_type='movement' AND q.status IN ('PENDING','FAILED','SYNCING') ORDER BY q.created_at,q.rowid`);
    const blocked = /* @__PURE__ */ new Set(), batch = [];
    for (const r of rows) {
      const metadata = movementMetadata(safeJson(r.payload_json) || {});
      const labels = serialDependencies({ ...metadata, cartonId: r.carton_id });
      if (r.status === "SYNCING" || Number(r.next_retry_at) > t || userId !== null && r.user_id !== userId || labels.some((key) => blocked.has(key))) {
        for (const key of labels) blocked.add(key);
        continue;
      }
      batch.push({ ...metadata, id: r.id, entityId: r.entity_id, status: r.status, attempts: Number(r.attempts) || 0, ts: Number(r.ts) || 0, userId: r.user_id || "", userName: r.user_name || "", cartonId: r.carton_id, article: r.article || "", type: r.type, qty: Number(r.qty) || 0, reason: r.reason || "", note: r.note || "", stockBefore: Number(r.stock_before) || 0, stockAfter: Number(r.stock_after) || 0, syncStatus: r.sync_status });
      if (batch.length >= (Number(limit) || 20)) break;
    }
    return batch;
  }
  async function markSyncing(id) {
    await init();
    const t = now();
    await run(`UPDATE sync_queue SET status='SYNCING',attempts=attempts+1,last_attempt_at=?,updated_at=? WHERE id=?`, [t, t, String(id)]);
    await run(`UPDATE movements SET sync_status='SYNCING',updated_at=? WHERE id=?`, [t, String(id)]);
  }
  async function markSynced(id, { serverId = id, stockAfter } = {}) {
    await init();
    const t = now();
    await run(`UPDATE sync_queue SET status='SYNCED',last_error=NULL,next_retry_at=0,updated_at=? WHERE id=?`, [t, String(id)]);
    await run(`UPDATE movements SET server_id=?,sync_status='SYNCED',stock_after=COALESCE(?,stock_after),updated_at=? WHERE id=?`, [String(serverId), stockAfter == null ? null : Number(stockAfter), t, String(id)]);
  }
  async function markRetry(id, error, nextRetryAt) {
    await init();
    const t = now();
    await run(`UPDATE sync_queue SET status='FAILED',last_error=?,next_retry_at=?,updated_at=? WHERE id=?`, [String(error || "SYNC_FAILED").slice(0, 500), Number(nextRetryAt) || t, t, String(id)]);
    await run(`UPDATE movements SET sync_status='FAILED',updated_at=? WHERE id=?`, [t, String(id)]);
  }
  async function markConflict(id, error) {
    await init();
    const t = now();
    await run(`UPDATE sync_queue SET status='CONFLICT',last_error=?,next_retry_at=0,updated_at=? WHERE id=?`, [String(error || "CONFLICT").slice(0, 500), t, String(id)]);
    await run(`UPDATE movements SET sync_status='CONFLICT',updated_at=? WHERE id=?`, [t, String(id)]);
  }
  async function applyServerStock(cartonId, stock, serverUpdatedAt = 0) {
    await init();
    await run(`UPDATE cartons SET stock=?,server_updated_at=?,local_updated_at=? WHERE id=?`, [Number(stock) || 0, Number(serverUpdatedAt) || now(), now(), String(cartonId)]);
  }
  async function queueDetails(limit = 100) {
    await init();
    return query(`SELECT id,entity_type,entity_id,status,attempts,last_error,created_at,updated_at,next_retry_at,last_attempt_at FROM sync_queue ORDER BY created_at DESC LIMIT ?`, [Number(limit) || 100]);
  }
  async function cacheUser(user = {}) {
    await init();
    if (!user.uid) return;
    if (globalThis.ZeroStockSecure?.isNative?.()) {
      await globalThis.ZeroStockSecure.setUser(user);
      await run(
        `INSERT INTO users_cache(uid,name,email,role,active,cached_at,payload_json) VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(uid) DO UPDATE SET name=excluded.name,email=excluded.email,role=excluded.role,active=excluded.active,cached_at=excluded.cached_at,payload_json=excluded.payload_json`,
        [String(user.uid), "", "", "", user.active === false ? 0 : 1, now(), "{}"]
      );
      return;
    }
    await run(
      `INSERT INTO users_cache(uid,name,email,role,active,cached_at,payload_json) VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(uid) DO UPDATE SET name=excluded.name,email=excluded.email,role=excluded.role,active=excluded.active,cached_at=excluded.cached_at,payload_json=excluded.payload_json`,
      [String(user.uid), String(user.name || ""), String(user.email || ""), String(user.role || ""), user.active === false ? 0 : 1, now(), JSON.stringify(user)]
    );
  }
  async function getCachedUser(uid) {
    await init();
    if (globalThis.ZeroStockSecure?.isNative?.()) {
      const secure = await globalThis.ZeroStockSecure.getUser(uid);
      if (secure) return secure;
    }
    const rows = await query(`SELECT * FROM users_cache WHERE uid=? LIMIT 1`, [String(uid || "")]);
    const r = rows[0];
    const legacy = r ? { ...safeJson(r.payload_json) || {}, uid: r.uid, name: r.name || "", email: r.email || "", role: r.role || "", active: Number(r.active) !== 0, cachedAt: Number(r.cached_at) || 0 } : null;
    if (legacy?.role && globalThis.ZeroStockSecure?.isNative?.()) {
      try {
        await globalThis.ZeroStockSecure.setUser(legacy);
        await run(`UPDATE users_cache SET name='',email='',role='',payload_json='{}' WHERE uid=?`, [String(uid)]);
      } catch {
      }
    }
    return legacy;
  }
  async function upsertTask(task = {}) {
    await init();
    const t = now();
    const sourceKey = String(task.sourceKey || task.source_key || task.id || uuid());
    const id = String(task.id || sourceKey);
    const payload = { ...task, id, sourceKey };
    await run(
      `INSERT INTO tasks(id,source_key,type,category,priority,status,reference_id,title,detail,action,icon,created_at,updated_at,resolved_at,payload_json)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,0,?)
    ON CONFLICT(source_key) DO UPDATE SET type=excluded.type,category=excluded.category,priority=excluded.priority,status='OPEN',reference_id=excluded.reference_id,title=excluded.title,detail=excluded.detail,action=excluded.action,icon=excluded.icon,updated_at=excluded.updated_at,resolved_at=0,payload_json=excluded.payload_json`,
      [id, sourceKey, String(task.type || "TASK"), String(task.category || "OTHER"), String(task.priority || "MEDIUM"), "OPEN", String(task.referenceId || ""), String(task.title || task.type || "Task"), String(task.detail || ""), String(task.action || ""), String(task.icon || ""), Number(task.createdAt) || t, t, JSON.stringify(payload)]
    );
    return id;
  }
  async function resolveTaskBySource(sourceKey) {
    await init();
    const t = now();
    await run(`UPDATE tasks SET status='RESOLVED',resolved_at=?,updated_at=? WHERE source_key=? AND status='OPEN'`, [t, t, String(sourceKey)]);
    return true;
  }
  async function reconcileSystemTasks(activeTasks = []) {
    await init();
    const active = new Set(activeTasks.map((x) => String(x.sourceKey || x.id)).filter(Boolean));
    for (const task of activeTasks) await upsertTask(task);
    const rows = await query(`SELECT source_key FROM tasks WHERE status='OPEN' AND (source_key LIKE 'stock:%' OR source_key LIKE 'sync:%')`);
    for (const r of rows) if (!active.has(String(r.source_key))) await resolveTaskBySource(r.source_key);
    return getTasks("OPEN", 250);
  }
  async function getTasks(status = "OPEN", limit = 250) {
    await init();
    let rows;
    if (status === "ALL") rows = await query(`SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?`, [Number(limit) || 250]);
    else rows = await query(`SELECT * FROM tasks WHERE status=? ORDER BY CASE priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, updated_at DESC LIMIT ?`, [String(status), Number(limit) || 250]);
    return rows.map((r) => ({ ...safeJson(r.payload_json) || {}, id: r.id, sourceKey: r.source_key, type: r.type, category: r.category, priority: r.priority, status: r.status, referenceId: r.reference_id || "", title: r.title, detail: r.detail || "", action: r.action || "", icon: r.icon || "", createdAt: Number(r.created_at) || 0, updatedAt: Number(r.updated_at) || 0, resolvedAt: Number(r.resolved_at) || 0 }));
  }
  async function createTask(task = {}) {
    const id = task.id || uuid();
    return upsertTask({ ...task, id, sourceKey: task.sourceKey || `manual:${id}` });
  }
  async function getSetting(key, fallback = null) {
    await init();
    const rows = await query(`SELECT value FROM settings WHERE key=? LIMIT 1`, [String(key)]);
    if (!rows.length) return fallback;
    const raw = rows[0].value;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  async function setSetting(key, value) {
    await init();
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    await run(`INSERT INTO settings(key,value,updated_at) VALUES(?,?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`, [String(key), String(raw), now()]);
    return true;
  }
  async function stats() {
    await init();
    const pending = await query(`SELECT COUNT(*) AS n FROM sync_queue WHERE status IN ('PENDING','SYNCING','FAILED','CONFLICT')`);
    const cartons = await query(`SELECT COUNT(*) AS n FROM cartons`);
    const moves = await query(`SELECT COUNT(*) AS n FROM movements`);
    const conflicts = await query(`SELECT COUNT(*) AS n FROM sync_queue WHERE status='CONFLICT'`);
    const failed = await query(`SELECT COUNT(*) AS n FROM sync_queue WHERE status='FAILED'`);
    const syncing = await query(`SELECT COUNT(*) AS n FROM sync_queue WHERE status='SYNCING'`);
    const tasks = await query(`SELECT COUNT(*) AS n FROM tasks WHERE status='OPEN'`);
    return { pending: Number(pending[0]?.n) || 0, conflicts: Number(conflicts[0]?.n) || 0, failed: Number(failed[0]?.n) || 0, syncing: Number(syncing[0]?.n) || 0, cartons: Number(cartons[0]?.n) || 0, movements: Number(moves[0]?.n) || 0, tasks: Number(tasks[0]?.n) || 0 };
  }
  function safeJson(v) {
    try {
      return v ? JSON.parse(v) : {};
    } catch {
      return {};
    }
  }
  window.ZeroStockOffline = {
    isNativeAvailable: native,
    init,
    cacheCartons,
    getCartons,
    cacheInstructions,
    getInstructions,
    cacheMovements,
    getMovements,
    recordMovement,
    getPendingMovements,
    getSyncBatch,
    markSyncing,
    markSynced,
    markRetry,
    markConflict,
    applyServerStock,
    queueDetails,
    cacheUser,
    getCachedUser,
    upsertTask,
    resolveTaskBySource,
    reconcileSystemTasks,
    getTasks,
    createTask,
    getSetting,
    setSetting,
    stats,
    schemaVersion: DB_VERSION,
    database: DB
  };
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
