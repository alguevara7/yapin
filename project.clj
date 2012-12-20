(defproject yapin "0.0.1-SNAPSHOT"
  :description "yet another pinboard safari extension"
  :url "http://yapin.halfrunt.net"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/clojurescript "0.0-1450"]]
  :plugins [[lein-cljsbuild "0.2.10"]]
  :source-paths ["src/clj"]
  :cljsbuild {:builds [{:id "global.js"
                        :source-path "src/cljs-global" 
                        :compiler {:output-to "yapin.safariextension/js/global.js" 
                       						 :optimizations :whitespace
                       						 :pretty-print true}}
                       {:id "bar.js"
                        :source-path "src/cljs-bar" 
                        :compiler {:output-to "yapin.safariextension/js/bar.js" 
                       						 :optimizations :whitespace
                       						 :pretty-print true}}
                       {:id "sidebar.js"
                        :source-path "src/cljs-sidebar" 
                        :compiler {:output-to "yapin.safariextension/js/sidebar.js" 
                       						 :optimizations :whitespace
                       						 :pretty-print true}}]})