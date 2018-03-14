/**
 * @file mip-app-banner 组件
 *
 * @author wangpei07@baidu.com
 */

define(function (require) {
    var appBannerElement = require('customElement').create();
    var fetchJsonp = require('fetch-jsonp');
    var viewer = require('viewer');
    var util = require('util');

    var platform = util.platform;

    appBannerElement.prototype.jumpToLink = function (openInAppUrl, installAppUrl) {
        var timer = setTimeout(function () {
            window.top.location.href = installAppUrl;
            logg('页面失焦1，猜测调起成功');
            clearTimeout(timer);
        }, 2500);

        window.open(openInAppUrl, '_top');

        var visibilitychange = function () {
            logg('页面失焦2，猜测调起成功');
            var tag = document.hidden || document.webkitHidden;
            tag && clearTimeout(timer);
        };

        document.addEventListener('visibilitychange', visibilitychange, false);
        document.addEventListener('webkitvisibilitychange', visibilitychange, false);
        window.addEventListener('pagehide', function () {
            logg('页面失焦3，猜测调起成功');
            clearTimeout(timer);
        }, false);
    };

    /**
     * 非iframe下，safari 会根据 <meta name="apple-itunes-app">
     * 此时不显示 MIP 组件banner。
     *
     * Android Chrome 虽然会根据 manifest.json 显示系统横幅，但条件较为苛刻，还是以组件调起为准。
     * manifest.json 显示系统横幅方法：https://github.com/mipengine/mip-extensions/issues/1026#issuecomment-363396075
     * > 25.0 chrome 可以使用chrome intent吊起App，所以高版本chrome不移除banner
     * 低版本chrome 可以使用manifest或scheme调起，也不移除banner。
     *
     * @return {boolean} 是否具有系统默认Banner
     */
    appBannerElement.prototype.hasSystemBanner = function () {
        // Safari
        var isSafari = platform.isSafari();
        if (!viewer.isIframed && isSafari && this.opt.iosMetaTag) {
            logg('safari 系统默认显示下载');
            return true;
        }

        // 其他浏览器，及iframe内打开MIP页的所有情况，需要展示组件Banner
        logg('无原生默认banner, 显示app-banner');
        return false;
    };

    appBannerElement.prototype.initIosBanner = function () {
        var openInAppUrl = '';
        var iosInstallUrl = '';

        if (platform.isWechatApp()) {
            // 获取微信中跳转链接-在Safari中打开或应用宝下载链接。
            // 由于safari中打开后可以直接调起应用，优先级高于应用宝。
            var wechatOpenSafari = this.opt.wechatOpenSafari;
            var wechatIosYyb = this.opt.wechatIosYyb;
            logg('ios 在微信中');
            openInAppUrl = wechatOpenSafari || wechatIosYyb;
        }
        else {
            // 拼接schema调起链接
            var content = this.opt.iosMetaTag && this.opt.iosMetaTag.getAttribute('content');
            var parts = content.replace(/\s/, '').split(',');
            var config = {};
            parts.forEach(function (part) {
                var params = part.split('=');
                config[params[0]] = params[1];
            });
            // 优先使用universalLink 调起应用链接
            var openInAppUrl = platform.getOsVersion().split('.')[0] >= 9 ? this.opt.iosUniversalLink : '';
            if (!openInAppUrl) {
                // Fallback 通用方案：拼接schema调起ios应用链接
                var iosSchemaLink = config['app-argument'];
                if (iosSchemaLink) {
                    openInAppUrl = iosSchemaLink;
                }
            }
            // 拼接appStore 下载应用跳转链接
            iosInstallUrl = 'https://itunes.apple.com/cn/app/id' + config['app-id'];
        }

        // 绑定点击-跳转事件
        var appBanner = this;
        var openButton = this.element.querySelector('[open-button]');
        openButton.addEventListener('click', function () {
            appBanner.jumpToLink(openInAppUrl, iosInstallUrl);
        });
        logg('ios 调起链接：' + openInAppUrl);
        logg('ios 下载链接: ' + iosInstallUrl);
    };

    appBannerElement.prototype.initAndroidBanner = function () {
        var openInAppUrl = '';
        var androidInstallUrl = '';
        var appBanner = this;

        if (platform.isWechatApp()) {
            // 获取微信中跳转链接-跳转到应用宝下载
            var wechatAndroidYyb = this.opt.wechatAndroidYyb;
            logg('安卓：在微信中');
            openInAppUrl = wechatAndroidYyb;
        }
        else {
            
            // 由于manifest优先级高，需要插入到跳转链接第一位。
            // manifest配置是异步返回，余下appLink，chromeIntent操作需要置于请求处理之后
            var manifestPromise = new Promise(function (resolve, reject) {
                if (!appBanner.opt.androidManifest) {
                    reject('manifest 不存在');
                    return;
                }

                // 判定manifest.json 地址为https, 强制要求。
                var href = appBanner.opt.androidManifest.getAttribute('href');
                if (/http:\/\//.test(href)) {
                    reject('manifest必须是https的连接');
                    return;
                }

                // 异步请求manifest.json文件，解析install、open关键字
                fetchJsonp(href).then(function (res) {
                    return res.json();
                }).then(function (data) {
                    var apps = data.related_applications;
                    if (!apps) {
                        reject('manifest 不合法，无 related_applications');
                        return;
                    }
                    for (var i = 0; i < apps.length; i++) {
                        var app = apps[i];
                        // 'play'实际上为google play, 历史原因不能删除。
                        // 文档及后续推广一律改为 'mip-app-banner'
                        if (app.platform === 'play' || app.platform === 'mip-app-banner') {
                            // androidInstallUrl - 下载链接
                            // openInAppArr - 调起链接
                            androidInstallUrl = app.install;
                            openInAppUrl = app.open;
                            resolve();
                            logg('manifest 获取跳转链接完成');
                        }
                    }
                }, function () {
                    reject('manifest.json 数据格式不合法');
                });
            });

            manifestPromise.then(function () {
                // dep/promise不支持finally, 只能再then一下
                return new Promise(function(res, rej) {
                    res();
                });
            }, function (error) {
                console.warn('mip-app-banner解析manifest失败：' + error);
                // dep/promise不支持finally, 只能再then一下
                return new Promise(function(res, rej) {
                    res();
                });
            }).then(function () {
                // ChromeIntent 要求安卓chrome版本高于25
                var canUseChromeIntent = platform.isChrome()
                    && navigator.userAgent.match(/Chrome\/(\d+)/)[1] > 25
                    && appBanner.opt.androidChromeIntent;
                // AndroidAppLink 要求安卓系统版本高于6.0
                var canUseAndroidAppLink = navigator.userAgent.match(/Android ([\d.]+)/)
                    && navigator.userAgent.match(/Android ([\d.]+)/)[1] >= '6.0'
                    && appBanner.opt.androidAppLink;
                if (canUseChromeIntent) {
                    openInAppUrl = appBanner.opt.androidChromeIntent;
                }
                else if (canUseAndroidAppLink) {
                    openInAppUrl = appBanner.opt.androidAppLink;
                }
                else if (!openInAppUrl){
                    // 如果从manifest未读取应用下载链接, 保底方法scheme调起
                    openInAppUrl = appBanner.opt.androidScheme;
                }

                // 如果从manifest未读取应用下载链接，则使用用户配置的"android-download"字段
                if (!androidInstallUrl) {
                    androidInstallUrl = appBanner.opt.androidDownload;
                }
                // 绑定点击-跳转事件
                var openButton = appBanner.element.querySelector('[open-button]');
                openButton.addEventListener('click', function () {
                    appBanner.jumpToLink(openInAppUrl, androidInstallUrl);
                });
                logg('android openInAppUrl：' + openInAppUrl);
                logg('android androidInstallUrl: ' + androidInstallUrl);
            });
        }
    };

    /**
     * 构造元素，只会运行一次
     */
    appBannerElement.prototype.firstInviewCallback = function () {
        var element = this.element;

        // 解析用户配置
        var jsonScript = element.querySelector('script[type="application/json"]');
        var jsonString = jsonScript ? jsonScript.innerHTML : '';
        var customOpt;
        try {
            customOpt = JSON.parse(jsonString);
        }
        catch (err) {
            console.warn('<mip-app-banner>配置不是合法JSON, ' + err.message);
            return;
        }
        this.opt = {
            iosMetaTag: document.head.querySelector('meta[name="apple-itunes-app"]'),
            iosUniversalLink: customOpt && customOpt['ios-universal-link'],
            androidManifest: document.head.querySelector('link[rel="manifest"]'),
            androidScheme: customOpt && customOpt['android-scheme'],
            androidDownload: customOpt && customOpt['android-download'],
            androidAppLink: customOpt && customOpt['android-app-link'],
            androidChromeIntent: customOpt && customOpt['android-chrome-intent'],
            wechatOpenSafari: customOpt && customOpt['wechat-open-safari'],
            wechatIosYyb: customOpt && customOpt['wechat-ios-yyb'],
            wechatAndroidYyb: customOpt && customOpt['wechat-android-yyb']
        };
        console.log(this.opt);

        // safari，android chrome, 会出现系统 banner
        if (this.hasSystemBanner()) {
            logg('存在原生 banner，移除组件');
            this.element.remove();
            return;
        }

        // 初始化Banner
        if (platform.isIos()) {
            this.initIosBanner();
            logg('初始化ios banner');
        }
        else if (platform.isAndroid()) {
            this.initAndroidBanner();
            logg('初始化安卓 banner');

        }

        // 显示banner
        util.css(element, {
            display: '',
            visibility: 'visible'
        });
        logg('banner 初始化完成，显示给用户');
    };
    return appBannerElement;

    function logg(arr) {
        var loggContainer = document.getElementById('logg');
        if (!loggContainer) {
            loggContainer = document.createElement('div');
            loggContainer.id = 'logg';
            loggContainer.setAttribute('style', 'display: block; position: fixed; bottom:0px; opacity: 0.8; background: #ddd; color: black; width: 100%; padding: 10px; max-height: 100px; overflow-y: scroll;');
            document.body.appendChild(loggContainer);
        }
        loggContainer.innerHTML += arr + '<br>';
    }
});
