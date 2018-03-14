# mip-app-banner App 调起组件

弹出【在 App 中打开】提示通栏，用户点击时调起原生 App，调起失败后跳转到下载页。

标题|内容
----|----
类型|通用
支持布局|responsive,fixed-height,fill,container,fixed
所需脚本|https://c.mipcdn.com/static/v1/mip-app-banner/mip-app-banner.js

## 示例

### 基本用法

`android-scheme` 填写安卓调起App链接，`android-download`填写安卓调起失败后下载链接。

```html
<head>
    <!--iOS App Store 下载配置-->
    <meta name="apple-itunes-app" content="app-id=0000000, app-argument=mipapp://open">
</head>
<body>
    <mip-app-banner id="my-app-banner" layout="nodisplay">
        <script type="application/json">
            {
                "android-scheme": "mipapp://open",
                "android-download": "https://m.mipapp.com/download"
            }
        </script>
        <span open-button>打开app</span>
    </mip-app-banner>
</body>
```

### 使用更多配置项

目前业界 App 调起的方法很多，示例中的配置对应不同的调起方式，选择合适的即可。如果不填写，将自动回退为 scheme 调起。

```html
<head>
    <!--iOS App Store 下载配置-->
    <meta name="apple-itunes-app" content="app-id=0000000, app-argument=mipapp://open">
    <!--Andriod 系统通栏配置，要求支持 HTTPs 访问-->
    <link rel="manifest" href="https://xxxx/manifest">
</head>
<body>
    <mip-app-banner id="my-app-banner" layout="nodisplay">
        <script type="application/json">
            {
                "ios-universal-link": "https://m.mipapp.com/open?xxx",

                "android-scheme": "mipapp://open",
                "android-download": "https://m.mipapp.com/download",
                "android-app-link" : "https://m.mipapp.com/open?xxx",
                "android-chrome-intent" : "Intent://mipapp/xxxx",

                "wechat-open-safari": "https://oia.zhihu.com/answers/319470613",
                "wechat-ios-yyb": "http://a.app.qq.com/o/simple.jsp?pkgname=com.baidu.searchbox",
                "wechat-android-yyb": "",
            }
        </script>
        <span open-button>打开app</span>
    </mip-app-banner>
</body>
```

## 属性

### id

说明：组件id，组件唯一标识  
必选项：是  
类型：字符串  
单位：无  
默认值：无  

### layout

说明：组件布局，只能设置值为nodisplay  
必选项：是  
类型：字符串  
取值范围：nodisplay  
单位：无  
默认值：nodisplay  

### 子节点 [open-button]

说明：调起 app 的按钮，必须带有 open-button 属性  
必选项：是  
类型：html 节点  
默认值：`<button open-button>`


## 配置说明

### iOS 系统配置

#### iOS URL Scheme 调起
字段名：`<meta name="apple-itunes-app">`
说明：[iOS URL Scheme](https://developer.apple.com/library/content/featuredarticles/iPhoneURLScheme_Reference/Introduction/Introduction.html) 普遍用于在 iOS 系统中应用之间的调起。需要在页面`head`标签中添加 `<meta name="apple-itunes-app">` 配置，safari 中会自动弹出系统横幅。
取值：参考上方示例
是否必填：是

#### iOS Universal Link 调起
字段名：ios-universal-link
说明：[Universal Link](https://developer.apple.com/library/content/documentation/General/Conceptual/AppSearch/UniversalLinks.html) 是苹果针对 iOS9+ 系统推出的应用调起方法。

### Android 系统配置

#### Manifest 调起（Android）
说明：[manifest.json](https://developer.mozilla.org/en-US/docs/Web/Manifest) 主要用于 Web App 配置，`related_applications` 字段用于配置对应的原生 App，文件储存在开发者服务器上。Andriod Chrome 等浏览器会读取配置，在浏览器中显示原生的应用调起横幅。
字段名：`<link rel="manifest">`
取值：参考上方示例
链接内容：参考文末 `manifest.json 示例`
是否必填：否，但与 `android-scheme` 必须二选一。

#### Android Scheme 调起（Deep Link）
字段名：android-scheme
说明：[Deep Link](https://developer.android.com/training/app-links/deep-linking.html) 是安卓通用的调起方法，可直接定位到应用的特定位置。  
取值：链接以 `http://`、`https://` 或自定义字段如 `mipapp://` 开头。
是否必填：否，但与 Manifest 必须二选一。

#### App 下载链接（Android）
字段名：android-download
说明：当用户未安装 App 时调起失败，跳转到 `android-download` 指向的 App 下载页面。当`Manifest 调起`中`install`参数无效时，自动使用 `android-download` 作为后备跳转链接。
取值：链接以 `http://`、`https://` 开头。
是否必填：否，建议填写。

#### App Link（Android）
字段名：android-app-link
说明：[App Link](https://developer.android.com/training/app-links/index.html) 是安卓针对系统版本 6.0 及以上的机型推出的调起方法，对标 iOS 的 Universal Link。链接以 http:// 或 https:// 开头。  
取值：合法URL
是否必填：否

#### Chrome Intent（Android）
字段名：android-chrome-intent
说明：[Chrome Intent](https://developer.chrome.com/multidevice/android/intents) 是通过 Android Intent 技术，在 Android Chrome 25+ 中实现应用调起的方法。在页面中填写一个[链接](https://developer.chrome.com/multidevice/android/intents)，就能够完成调起 App，调起失败跳转 App 下载页等功能。
取值：参考 [intent 文档](https://developer.chrome.com/multidevice/android/intents)

### 针对腾讯部分浏览器的特殊配置

腾讯 QQ 聊天 App，微信 App 屏蔽了应用调起方式。目前在 iOS 中只有两种办法解决：提示用户在safari中打开页面，或跳转到[腾讯应用宝](http://wiki.open.qq.com/wiki/%E7%A7%BB%E5%8A%A8%E5%BA%94%E7%94%A8%E6%8E%A5%E5%85%A5%E6%96%B0%E6%89%8B%E6%8C%87%E5%BC%95)链接。而在安卓系统中只能配置腾讯应用宝链接。

#### 提醒用户在safari中打开
字段名：wechat-open-safari
取值：合法URL。落地页需要判断是否在微信中，在微信中显示【点击右上角，选择在safari中打开】。
默认值： 无

#### iOS 应用宝链接
字段名：wechat-ios-yyb
是否必填：否

#### 安卓应用宝链接
字段名：wechat-android-yyb
是否必填：否

## 浏览器兼容性

<!-- TODO 需要修改，这写的啥 -->
浏览器|Android+chrome|Android+baidu|IOS+safari |其他情况
---|---|---|---|---
结果页打开|支持|不支持屏蔽|不支持，暂时屏蔽|支持
非结果页打开|不支持屏蔽|不支持屏蔽|浏览器banner|支持


## 注意事项

### 校验规则

- `<meta name="apple-itunes-app"` 必须填写。
- `<link rel="manifest"` 和 `android-scheme` 至少填写一个。
- `<link rel="manifest"` url 必须是 https的。
- `android-scheme` 和 `android-scheme` 必须同时存在。

### manifest.json 示例
<!-- TODO 需要修改，这不符合规范 -->
```
{
  "prefer_related_applications": true, 
  "related_applications": [
    {
      "platform": "mip-app-banner",
      "open": "scheme://xx",
      "install": "your download url"
    }
  ]
}
```
