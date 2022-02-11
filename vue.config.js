// vue.config.js
const path = require("path");

// 开启gzip压缩，按需引用
// const CompressionWebpackPlugin = require("compression-webpack-plugin");
// 开启gzip压缩，按需写入
const productionGzipExtensions = /\.(js|css|json|txt|html|icon|svg)(\?>*)?$/i;
// 打包分析
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer");

// 是否是生产环境
const isProduction = ["production", "prod"].includes(process.env.NODE_ENV);

const resolve = (dir) => path.join(__dirname, dir);

// 配置预解析的内容
const sourcePrefetch = {
    // dns预解析
    dns: ["http://jquery.cdn.com"],
    // 字体预解析
    fonts: [`/static/fonts/SourceHanSansCN-Regular.woff2`]
};

module.exports = {
    // 基本路径
    publicPath: "",
    // publicPath: "../dist/",
    // 相对于打包路径index.html的路径
    indexPath: "index.html",
    // 文件输出目录
    outputDir: "dist",
    // eslint-loader 是否在保存的时候检查
    lintOnSave: false,
    // 生成的静态资源存放的目录
    assetsDir: "",
    // 是否使用包含运行时编译器的vue构建版本
    runtimeCompiler: false,
    // 是否为babel或typescript使用thread-loader，在系统的CPU有多于一个内核时自动启用，仅作用于生产环境，在适当的时候开启多线程去并发的执行压缩
    parallel: require("os").cpus().length > 1,
    // 生产环境是否生成sourceMap 文件，一般不建议打开
    productionSourceMap: false,
    // webpack-dev-server相关配置
    devServer: {
        // url地址
        host: "127.0.0.1",
        // 端口号
        port: 8080,
        // 配置是否是https
        https: false,
        // 配置自动启动浏览器
        open: true,
        // 启动热更新
        hotOnly: true,
        // 配置代理，处理多个跨域
        proxy: {
            "/api": {
                target: "http://api.cdn.com:8090/api",
                changeOrigin: true,
                pathRewrite: {
                    "^/api": "/"
                }
            },
            "/api2": {
                target: "http://api2.cdn.com:8090/api2",
                changeOrigin: true,
                pathRewrite: {
                    "^/api2": "/"
                }
            }
        }
    },
    // 对内部的webpack进行更细粒度的修改
    chainWebpack: (config) => {
        // 修复热更新失效
        config.resolve.symlinks(true);
        //  如果使用多页打包，使用vue inspect --plugins 查看html是都在结果数组中
        config.plugin("html").tap((args) => {
            // 修复路由懒加载的报错
            args[0].chunksSortMode = "none";
            // 预解析
            args[0].sourcePrefetch = sourcePrefetch;
            return args;
        });
        // 文件引入时，自定义别名
        config.resolve.alias.set("@", resolve("src"));
        // 字体文件自定义配置
        config.module
            .rule("fonts")
            .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
            .use("url-loader")
            .loader("url-loader")
            .options({
                limit: 4096,
                fallback: {
                    loader: "file-loader",
                    options: {
                        name: `/static/fonts/[name].[ext]`
                    }
                }
            });
        if (isProduction) {
            // 去除懒加载的 prefetch
            config.plugins.delete("prefetch");
            // 打包分析, 打包后会自动生成一个report.html文件
            // config.plugin("webpack-report").use(BundleAnalyzerPlugin, [{ analyzerMode: "static" }]);
        }
    },
    // 调整webpack配置
    configureWebpack: (config) => {
        if (isProduction) {
            // 开启gzip压缩
            // config.plugins.push(
            //     new CompressionWebpackPlugin({
            //         filename: "[path].gz[query]",
            //         algorithm: "gzip",
            //         test: productionGzipExtensions,
            //         threshold: 10240,
            //         minRatio: 0.8
            //     })
            // );
            // 取消webpack警告性能的提示
            config.performance = {};
        }
        // 打包分离js
        config.optimization = {
            splitChunks: {
                chunks: "async",
                minChunks: 2,
                minSize: 100000,
                cacheGroups: {
                    base: {
                        name: "base",
                        minChunks: 1,
                        test: /[\\/]node_modules[\\/]vue[\\/]|[\\/]node_modules[\\/]vue-router[\\/]|[\\/]node_modules[\\/]vuex[\\/]|[\\/]node_modules[\\/]axios[\\/]/,
                        chunks: "initial",
                        priority: -3
                    },
                    antd: {
                        name: "ant-design",
                        test: /[\\/]node_modules[\\/]ant-design-vue[\\/]/,
                        chunks: "initial",
                        minChunks: 1,
                        priority: -4,
                        reuseExistingChunk: true,
                        enforce: true
                    }
                }
            }
        };
        config.optimization.runtimeChunk = {
            name: "manifest"
        };
    },
    // css配置相关
    css: {},
    // PWA插件相关配置
    pwa: {},
    // 第三方插件配置
    pluginOptions: {}
};
