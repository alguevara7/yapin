(ns yapin.util)

; TODO : move to global. it is good because the code will be loaded once only, but it will make 
;        this code harder to use from bar.cjls

; copied from jayq
(defn clj->js
  "Recursively transforms ClojureScript maps into Javascript objects,
   other ClojureScript colls into JavaScript arrays, and ClojureScript
   keywords into JavaScript strings."
  [x]
  (cond
    (string? x) x
    (keyword? x) (name x)
    (map? x) (let [obj (js-obj)]
               (doseq [[k v] x]
                 (aset obj (clj->js k) (clj->js v)))
               obj)
    (coll? x) (apply array (map clj->js x))
    :else x))

;const myGlobal = safari.extension.globalPage.contentWindow;
(def global-ns
  js/safari.extension.globalPage.contentWindow.yapin.global)

(defn active-browser-window []
  js/safari.application.activeBrowserWindow)

(defn find-extension-bar [identifier]
  (first (filter #(= identifier (.-identifier %))
                 js/safari.extension.bars)))

(defn dispatch-page-message 
  ([name message] (dispatch-page-message js/safari.application.activeBrowserWindow.activeTab.page name message))
  ([page name message] (.dispatchMessage page name message)))

(defn find-element [window id]
  (let [document (.-document window)]
    (.getElementById document id)))
