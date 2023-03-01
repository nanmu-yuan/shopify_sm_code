!(function (g, $, u) {
    var public = u.public
    var OPAnalytics = u.OPAnalytics
    try {
        if (!OPAnalytics) return
        OPAnalytics.prototype.track = function (o) {
            if (typeof o === 'function') return
            if (!Object.keys(o).length || !o.action) return
            var actions = {
                'EXPOSE': _handleExposure,
                'CLICK': _handleClick,
                'VIEW': _handleView,
                'customer': _handleCustomer,
                'CART': _handleCart,
                'PAY': _handlePay
            }
            console.log(o.action)
            actions[o.action](o)
        }
        // 初始化OPAnalytics
        g.OPAnalytics = new OPAnalytics()
        // 埋点的业务逻辑
        // 曝光
        var _handleExposure = function (o) {
            var num = 4,
                // locationInfo = o.page === 'detail' ? 'detail' : (o.page === 'list'||o.page === 'home') ? 'list' : 'other',
                locationInfo = o.page === 'detail' ? 'detail' : (o.page === 'list'||o.page === 'home') ? 'list' : 'other',
                dataObj = $.extend({}, o),
                isSendedData = {},
                productsNumInARow = {
                    'detail': function () {
                        if (window.matchMedia("(min-width: 768px)").matches) {
                            num = 6
                        } else {
                            num = 2
                        }
                    },
                    'list': function () {
                        if (window.matchMedia("(min-width: 769px)").matches) {
                            num = 4
                        } else if (window.matchMedia("(min-width: 480px) and (max-width: 768px)").matches) {
                            num = 3
                        } else {
                            num = 2
                        }
                    },
                    'other': function () {
                        if (window.matchMedia("(min-width: 769px)").matches) {
                            num = 4
                        } else if (window.matchMedia("(min-width: 480px) and (max-width: 768px)").matches) {
                            num = 3
                        } else {
                            num = 2
                        }
                    },
                }
            productsNumInARow[locationInfo]()

            var _scrollHandler = function () {
                var products;
                if (window.location.search.indexOf('words') > -1) {
                    // 404.vm
                    products = $('.cbb-also-bought-product').length ? $('.cbb-also-bought-product') : $('.collection-list-products .grid-product')
                } else {
                    products = $(dataObj.targetEl)
                }

                var linesNum = Math.ceil(products.length / num);

                !products.length && console.error('OPAnalytics handleExposure needs some child elements, please Check the parameter for "targetel".')

                for (var i = 0; i < linesNum; i++) {
                    var index = i * num,
                        lineStartEl = products.eq(index),
                        isEnterViewPort = public.utils.isEnterViewPort(lineStartEl[0]),
                        report = function () {
                            var desc = []
                            for (var j = i * num; j < num + i * num; j++) {
                                var temp = {}
                                if(products.eq(j).length) {
                                    if(locationInfo == 'detail'){
                                        temp['s'] = products.eq(j).find('.sf__pcard').data('product-vendor') || ''
                                    }else{
                                        temp['s'] = products.eq(j).data('product-vendor')  || ''
                                    }
                                    temp['e'] = products.eq(j).data('exposureposition')  || ''    
                                }
                                desc.push(temp)
                            }
                            dataObj.desc = desc
                            isSendedData[i] = dataObj
                            g.OPAnalytics.dataReport(dataObj)
                        }
                    // !isSendedData[i] 避免重复曝光
                    if (isEnterViewPort.isInViewPort() && !isSendedData[i]) {
                        report()
                    } else if (isEnterViewPort.isAboveEnteringViewPort() && !isSendedData[i]) {
                        report()
                    } else if (isEnterViewPort.isBottomEnteringViewPort() && !isSendedData[i]) {
                        report()
                    }
                }
            }
            g.addEventListener('load', function () {
                $(g).on('scroll', public.utils.throttle(_scrollHandler, 300))             
            })
        }
        // 点击（自动绑定，如果想发送手动绑定请将action修改为customer
        var _handleClick = function (o) {
            var dataObj = $.extend({}, o),
                locationInfo = o.page === 'detail' ? 'detail' : o.page === 'list' ? 'list' : 'other',
                _productClickedHandler = function () {
                    var temp = {};
                    if(locationInfo == 'detail'){
                        temp['s'] = $(this).find('.sf__pcard').data('product-vendor') || ''
                    }else{
                        temp['s'] = $(this).data('product-vendor') || ''
                    }
                    temp['e'] = $(this).data('exposureposition') || ''


                    dataObj.desc = [temp]
                }
            // if(locationInfo == 'detail'){
            //     let timer = setInterval(()=>{
            //         $(dataObj.targetEl).find('a').on('click',_productClickedHandler.after(dataObj))
            //         clearInterval(timer);
            //     },500)                
            // }else{
            //     $(document).on('click', dataObj.targetEl, _productClickedHandler.after(dataObj))
            // }
            $(document).on('click', dataObj.targetEl, _productClickedHandler.after(dataObj))
        }

        // 自定义
        var _handleCustomer = function (o) {
            g.OPAnalytics.dataReport(o)
        }

        // 浏览
        var _handleView = function (o) {
            g.OPAnalytics.dataReport(o)
        }

        // 加车
        var _handleCart = function (o) {
            if (o.bindedEl) {
                var dataObj = $.extend({}, o),
                    _productClickedHandler = function () {
                        dataObj.desc = $('#productSpu').val() || ''
                    }
                $(document).on('click', dataObj.targetEl, _productClickedHandler.after(dataObj))
            } else {
                g.OPAnalytics.dataReport(o)
            }
        }

        // 支付成功
        var _handlePay = function (o) {
            g.OPAnalytics.dataReport(o)
        }

    } catch (e) {
        console.log('op-analytics has errors: ', e)
    }

})(window, jQuery, (function (g, $, public) {
    try {
        // 埋点主逻辑
        var OPAnalytics = function () {
            var uuid = public.utils.getCookie('optiMonkClientId') || '',
                uuidDaily = public.utils.getCookie('optiMonkClient') || '',
                vdid = public.utils.getCookie('vdid') || '',
                uaParser = public.utils.uaParser,
                utmData = public.utils.getCookie('_shopify_sa_p') || '',
                utmSource = '',
                utmMedium = '',
                utmCampaign = '',
                utmTerm = '',
                utmContent = '',
                utmAdset = '',
                spw = '',
                sph = '';

                if(utmData!=null&&utmData!=''){
                    utmData = decodeURI(utmData)
                    if(utmData.length>0){
                        utmData = '{"'+utmData.replaceAll('=','":"').replaceAll('&','","')+'"}'
                        var utmDataObj = JSON.parse(utmData)
                        utmSource = utmDataObj.utm_source || '';
                        utmMedium = utmDataObj.utm_medium || '';
                        utmCampaign = utmDataObj.utm_campaign || '';
                        utmTerm = utmDataObj.utm_term || '';
                        utmContent = utmDataObj.utm_content || '';
                        utmAdset = utmDataObj.utm_adset || '';
                    }
                    
                }


            if (window.devicePixelRatio) {
                spw = window.screen.width * window.devicePixelRatio
                sph = window.screen.height * window.devicePixelRatio
            }

            this.postUrl = '//statistics.orderplus.com/web-event/log' // prod
            // this.postUrl = '//statistics.beta.orderplus.com/web-event/log' // beta
            
            this.publicData = {
                uuid: uuid,
                uuidDaily: uuidDaily,
                vdid: vdid,
                referrer: document.referrer,
                language: public.data.language,
                device: public.data.device,
                screenPixel: window.devicePixelRatio ? spw + 'x' + sph : '',
                screenSize: window.screen.width + 'x' + window.screen.height,
                browserName: uaParser.browser.name,
                browserVersion: uaParser.browser.version,
                osName: uaParser.os.name,
                osVersion: uaParser.os.version,
                urlPath: document.referrer,
                utmSource: utmSource,
                utmMedium: utmMedium,
                utmCampaign: utmCampaign,
                utmTerm: utmTerm,
                utmContent: utmContent,
                utmAdset: utmAdset,
                // currency: public.utils.getCookie('ccy') || '',
                currency: public.data.COUNTRY_CODE || '',
                ipCountry: public.utils.getCookie('localization') || '',
                hostname: '',
                sitename: public.data.sitename || '',
                siteType: 'shopify'
            }
            this.dataConfig = ['name', 'url', 'sitename', 'page', 'menu', 'bindedEl', 'targetEl', 'action', 'desc', 'timestamp', 'uuid', 'uuidDaily', 'vdid', 'referrer', 'language', 'device', 'screenPixel', 'screenSize', 'browserName', 'browserVersion', 'osName', 'osVersion',
                'urlPath', 'utmCampain', 'utmContent', 'utmMedium', 'utmSource', 'utmTerm','utmAdset',
                'currency', 'ipCountry', 'orderCount', 'price', 'hostname'
            ]
            this.init()
        }

        OPAnalytics.prototype = {
            constructor: OPAnalytics,
            _createAOPFunctions: function () {
                var self = this
                Function.prototype.before = function (obj) {
                    var _self = this
                    return function () {
                        self._isObject(obj)
                        return _self.apply(this, arguments)
                    }
                }
                Function.prototype.after = function (obj) {
                    var _self = this
                    return function () {
                        var ret = _self.apply(this, arguments)
                        self._isObject(obj)
                        return ret
                    }
                }
            },
            _isObject: function (obj) {
                if (Object.prototype.toString.apply(obj).slice(8, -1) === 'Function') {
                    obj.apply(this, arguments)
                } else if (Object.prototype.toString.apply(obj).slice(8, -1) === 'Object') {
                    this.dataReport(obj)
                }
            },
            toQueryString: function (data) {
                return this.dataConfig.reduce(function (str, key, i) {
                    if (i === 0) {
                        str += (encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
                    } else {
                        if (data[key] === undefined) return str
                        str += ('&' + encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
                    }
                    return str
                }, '')
            },
            ajax: function () {
                var args = arguments[0];
                var argData = args.data;
                var ajaxData = {
                    type: "POST",
                    url: this.postUrl,
                    contentType: "application/json",
                };
                var xhr = this.createxmlHttpRequest();
                xhr.open(ajaxData.type, ajaxData.url);
                xhr.setRequestHeader("Content-Type", ajaxData.contentType);
                xhr.onreadystatechange = function () {
                    try {
                        if (xhr.readyState == 4) {
                            if (xhr.status == 200) {
                                args.success && args.success(xhr.responseText);
                            } else {
                                args.failed && args.failed(xhr.status);
                            }
                        }
                    } catch (e) {
                        console.warn('analytics has some errors: ', e)
                    }
                }
                if (ajaxData.type === "POST") {
                    xhr.send(JSON.stringify(argData));
                } else {
                    xhr.send();
                }
            },
            createxmlHttpRequest: function () {
                if (window.ActiveXObject) {
                    return new ActiveXObject("Microsoft.XMLHTTP");
                } else if (window.XMLHttpRequest) {
                    return new XMLHttpRequest();
                }
            },
            dataReport: function (data) {
                var timestamp = new Date().getTime(),
                    data = $.extend({
                        timestamp: timestamp
                    }, this.publicData, data),
                    sendData = {
                        // data: this.toQueryString(data),
                        data: data,
                        success: function (res) {},
                        failed: function (err) {
                            console.error(err);
                            return;
                        }
                    }

                this.ajax(sendData)
                // console.log('pic: ', data)
            },
            init: function () {
                this._createAOPFunctions()
            }
        }
        return {
            OPAnalytics: OPAnalytics,
            public: public
        }

    } catch (e) {
        console.log('op-analytics core has errors: ', e)
    }
})(window, jQuery, (function(Cloud){
    var utils = {
        getCookie: function (objName) {
            var arrStr = document.cookie.split("; ");
            for (var i = 0; i < arrStr.length; i++) {
                var temp = arrStr[i].split("=");
                if (temp[0] == objName) {
                    return decodeURIComponent(temp[1])
                }
            }
        },
        throttle: function(fn, interval) {
            console.log(99);
            var __self = fn,
            timer, firstTime = true;
            return function() {
                var args = arguments,
                __me = this;
                if (firstTime) {
                    __self.apply(__me, args);
                    return firstTime = false
                }
                if (timer) {
                    return false
                }
                timer = setTimeout(function() {
                    clearTimeout(timer);
                    timer = null;
                    __self.apply(__me, args)
                },
                interval || 500)
            }
        },
        isEnterViewPort: function(el) {
            var elRectPos = el.getBoundingClientRect(),
            clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
            elTop = elRectPos.top,
            elBottom = elRectPos.bottom;
            var _isAboveViewPort = function() {
                var condition = elTop < 0 && elBottom < 0;
                return condition ? true: false
            };
            var _isAboveEnteringViewPort = function() {
                var condition;
                if (public.data.device === 'PC') {
                    condition = elTop > 0 && clientHeight - elTop > 0 && elBottom > clientHeight
                } else {
                    condition = elTop > 0 && clientHeight - 50 - elTop > 0 && elBottom > clientHeight - 50
                };
                return condition ? true: false
            };
            var _isInViewPort = function() {
                var condition = elTop > 0 && clientHeight - elTop > 0 && elBottom > 0 && clientHeight - elBottom >= 0;
                return condition ? true: false
            };
            var _isBottomEnteringViewPort = function() {
                var condition = elTop < 0 && elBottom > 55 && clientHeight - elBottom > 0;
                return condition ? true: false
            };
            var _isBottomViewPort = function() {
                var condition = elTop >= clientHeight && elBottom > clientHeight;
                return condition ? true: false
            };
            return {
                isAboveViewPort: _isAboveViewPort,
                isAboveEnteringViewPort: _isAboveEnteringViewPort,
                isInViewPort: _isInViewPort,
                isBottomEnteringViewPort: _isBottomEnteringViewPort,
                isBottomViewPort: _isBottomViewPort
            }
        },
        uaParser: (function() {var uaRes = (function(window,undefined){var LIBVERSION="0.7.19",EMPTY="",UNKNOWN="?",FUNC_TYPE="function",UNDEF_TYPE="undefined",OBJ_TYPE="object",STR_TYPE="string",MAJOR="major",MODEL="model",NAME="name",TYPE="type",VENDOR="vendor",VERSION="version",ARCHITECTURE="architecture",CONSOLE="console",MOBILE="mobile",TABLET="tablet",SMARTTV="smarttv",WEARABLE="wearable",EMBEDDED="embedded";var util={extend:function(regexes,extensions){var margedRegexes={};for(var i in regexes){if(extensions[i]&&extensions[i].length%2===0){margedRegexes[i]=extensions[i].concat(regexes[i])}else{margedRegexes[i]=regexes[i]}}return margedRegexes},has:function(str1,str2){if(typeof str1==="string"){return str2.toLowerCase().indexOf(str1.toLowerCase())!==-1}else{return false}},lowerize:function(str){return str.toLowerCase()},major:function(version){return typeof version===STR_TYPE?version.replace(/[^\d\.]/g,"").split(".")[0]:undefined},trim:function(str){return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,"")}};var mapper={rgx:function(ua,arrays){var i=0,j,k,p,q,matches,match;while(i<arrays.length&&!matches){var regex=arrays[i],props=arrays[i+1];j=k=0;while(j<regex.length&&!matches){matches=regex[j++].exec(ua);if(!!matches){for(p=0;p<props.length;p++){match=matches[++k];q=props[p];if(typeof q===OBJ_TYPE&&q.length>0){if(q.length==2){if(typeof q[1]==FUNC_TYPE){this[q[0]]=q[1].call(this,match)}else{this[q[0]]=q[1]}}else{if(q.length==3){if(typeof q[1]===FUNC_TYPE&&!(q[1].exec&&q[1].test)){this[q[0]]=match?q[1].call(this,match,q[2]):undefined}else{this[q[0]]=match?match.replace(q[1],q[2]):undefined}}else{if(q.length==4){this[q[0]]=match?q[3].call(this,match.replace(q[1],q[2])):undefined}}}}else{this[q]=match?match:undefined}}}}i+=2}},str:function(str,map){for(var i in map){if(typeof map[i]===OBJ_TYPE&&map[i].length>0){for(var j=0;j<map[i].length;j++){if(util.has(map[i][j],str)){return i===UNKNOWN?undefined:i}}}else{if(util.has(map[i],str)){return i===UNKNOWN?undefined:i}}}return str}};var maps={browser:{oldsafari:{version:{"1.0":"/8",1.2:"/1",1.3:"/3","2.0":"/412","2.0.2":"/416","2.0.3":"/417","2.0.4":"/419","?":"/"}}},device:{amazon:{model:{"Fire Phone":["SD","KF"]}},sprint:{model:{"Evo Shift 4G":"7373KT"},vendor:{HTC:"APA",Sprint:"Sprint"}}},os:{windows:{version:{ME:"4.90","NT 3.11":"NT3.51","NT 4.0":"NT4.0",2000:"NT 5.0",XP:["NT 5.1","NT 5.2"],Vista:"NT 6.0",7:"NT 6.1",8:"NT 6.2",8.1:"NT 6.3",10:["NT 6.4","NT 10.0"],RT:"ARM"}}}};var regexes={browser:[[/(opera\smini)\/([\w\.-]+)/i,/(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,/(opera).+version\/([\w\.]+)/i,/(opera)[\/\s]+([\w\.]+)/i],[NAME,VERSION],[/(opios)[\/\s]+([\w\.]+)/i],[[NAME,"Opera Mini"],VERSION],[/\s(opr)\/([\w\.]+)/i],[[NAME,"Opera"],VERSION],[/(kindle)\/([\w\.]+)/i,/(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]*)/i,/(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,/(?:ms|\()(ie)\s([\w\.]+)/i,/(rekonq)\/([\w\.]*)/i,/(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark)\/([\w\.-]+)/i],[NAME,VERSION],[/(trident).+rv[:\s]([\w\.]+).+like\sgecko/i],[[NAME,"IE"],VERSION],[/(edge|edgios|edga)\/((\d+)?[\w\.]+)/i],[[NAME,"Edge"],VERSION],[/(yabrowser)\/([\w\.]+)/i],[[NAME,"Yandex"],VERSION],[/(puffin)\/([\w\.]+)/i],[[NAME,"Puffin"],VERSION],[/(focus)\/([\w\.]+)/i],[[NAME,"Firefox Focus"],VERSION],[/(opt)\/([\w\.]+)/i],[[NAME,"Opera Touch"],VERSION],[/((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i],[[NAME,"UCBrowser"],VERSION],[/(comodo_dragon)\/([\w\.]+)/i],[[NAME,/_/g," "],VERSION],[/(micromessenger)\/([\w\.]+)/i],[[NAME,"WeChat"],VERSION],[/(brave)\/([\w\.]+)/i],[[NAME,"Brave"],VERSION],[/(qqbrowserlite)\/([\w\.]+)/i],[NAME,VERSION],[/(QQ)\/([\d\.]+)/i],[NAME,VERSION],[/m?(qqbrowser)[\/\s]?([\w\.]+)/i],[NAME,VERSION],[/(BIDUBrowser)[\/\s]?([\w\.]+)/i],[NAME,VERSION],[/(2345Explorer)[\/\s]?([\w\.]+)/i],[NAME,VERSION],[/(MetaSr)[\/\s]?([\w\.]+)/i],[NAME],[/(LBBROWSER)/i],[NAME],[/xiaomi\/miuibrowser\/([\w\.]+)/i],[VERSION,[NAME,"MIUI Browser"]],[/;fbav\/([\w\.]+);/i],[VERSION,[NAME,"Facebook"]],[/safari\s(line)\/([\w\.]+)/i,/android.+(line)\/([\w\.]+)\/iab/i],[NAME,VERSION],[/headlesschrome(?:\/([\w\.]+)|\s)/i],[VERSION,[NAME,"Chrome Headless"]],[/\swv\).+(chrome)\/([\w\.]+)/i],[[NAME,/(.+)/,"$1 WebView"],VERSION],[/((?:oculus|samsung)browser)\/([\w\.]+)/i],[[NAME,/(.+(?:g|us))(.+)/,"$1 $2"],VERSION],[/android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i],[VERSION,[NAME,"Android Browser"]],[/(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i],[NAME,VERSION],[/(dolfin)\/([\w\.]+)/i],[[NAME,"Dolphin"],VERSION],[/((?:android.+)crmo|crios)\/([\w\.]+)/i],[[NAME,"Chrome"],VERSION],[/(coast)\/([\w\.]+)/i],[[NAME,"Opera Coast"],VERSION],[/fxios\/([\w\.-]+)/i],[VERSION,[NAME,"Firefox"]],[/version\/([\w\.]+).+?mobile\/\w+\s(safari)/i],[VERSION,[NAME,"Mobile Safari"]],[/version\/([\w\.]+).+?(mobile\s?safari|safari)/i],[VERSION,NAME],[/webkit.+?(gsa)\/([\w\.]+).+?(mobile\s?safari|safari)(\/[\w\.]+)/i],[[NAME,"GSA"],VERSION],[/webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i],[NAME,[VERSION,mapper.str,maps.browser.oldsafari.version]],[/(konqueror)\/([\w\.]+)/i,/(webkit|khtml)\/([\w\.]+)/i],[NAME,VERSION],[/(navigator|netscape)\/([\w\.-]+)/i],[[NAME,"Netscape"],VERSION],[/(swiftfox)/i,/(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,/(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([\w\.-]+)$/i,/(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,/(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,/(links)\s\(([\w\.]+)/i,/(gobrowser)\/?([\w\.]*)/i,/(ice\s?browser)\/v?([\w\._]+)/i,/(mosaic)[\/\s]([\w\.]+)/i],[NAME,VERSION]],cpu:[[/(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i],[[ARCHITECTURE,"amd64"]],[/(ia32(?=;))/i],[[ARCHITECTURE,util.lowerize]],[/((?:i[346]|x)86)[;\)]/i],[[ARCHITECTURE,"ia32"]],[/windows\s(ce|mobile);\sppc;/i],[[ARCHITECTURE,"arm"]],[/((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i],[[ARCHITECTURE,/ower/,"",util.lowerize]],[/(sun4\w)[;\)]/i],[[ARCHITECTURE,"sparc"]],[/((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+[;l]))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i],[[ARCHITECTURE,util.lowerize]]],device:[[/\((ipad|playbook);[\w\s\);-]+(rim|apple)/i],[MODEL,VENDOR,[TYPE,TABLET]],[/applecoremedia\/[\w\.]+ \((ipad)/],[MODEL,[VENDOR,"Apple"],[TYPE,TABLET]],[/(apple\s{0,1}tv)/i],[[MODEL,"Apple TV"],[VENDOR,"Apple"]],[/(archos)\s(gamepad2?)/i,/(hp).+(touchpad)/i,/(hp).+(tablet)/i,/(kindle)\/([\w\.]+)/i,/\s(nook)[\w\s]+build\/(\w+)/i,/(dell)\s(strea[kpr\s\d]*[\dko])/i],[VENDOR,MODEL,[TYPE,TABLET]],[/(kf[A-z]+)\sbuild\/.+silk\//i],[MODEL,[VENDOR,"Amazon"],[TYPE,TABLET]],[/(sd|kf)[0349hijorstuw]+\sbuild\/.+silk\//i],[[MODEL,mapper.str,maps.device.amazon.model],[VENDOR,"Amazon"],[TYPE,MOBILE]],[/android.+aft([bms])\sbuild/i],[MODEL,[VENDOR,"Amazon"],[TYPE,SMARTTV]],[/\((ip[honed|\s\w*]+);.+(apple)/i],[MODEL,VENDOR,[TYPE,MOBILE]],[/\((ip[honed|\s\w*]+);/i],[MODEL,[VENDOR,"Apple"],[TYPE,MOBILE]],[/(blackberry)[\s-]?(\w+)/i,/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]*)/i,/(hp)\s([\w\s]+\w)/i,/(asus)-?(\w+)/i],[VENDOR,MODEL,[TYPE,MOBILE]],[/\(bb10;\s(\w+)/i],[MODEL,[VENDOR,"BlackBerry"],[TYPE,MOBILE]],[/android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone)/i],[MODEL,[VENDOR,"Asus"],[TYPE,TABLET]],[/(sony)\s(tablet\s[ps])\sbuild\//i,/(sony)?(?:sgp.+)\sbuild\//i],[[VENDOR,"Sony"],[MODEL,"Xperia Tablet"],[TYPE,TABLET]],[/android.+\s([c-g]\d{4}|so[-l]\w+)\sbuild\//i],[MODEL,[VENDOR,"Sony"],[TYPE,MOBILE]],[/\s(ouya)\s/i,/(nintendo)\s([wids3u]+)/i],[VENDOR,MODEL,[TYPE,CONSOLE]],[/android.+;\s(shield)\sbuild/i],[MODEL,[VENDOR,"Nvidia"],[TYPE,CONSOLE]],[/(playstation\s[34portablevi]+)/i],[MODEL,[VENDOR,"Sony"],[TYPE,CONSOLE]],[/(sprint\s(\w+))/i],[[VENDOR,mapper.str,maps.device.sprint.vendor],[MODEL,mapper.str,maps.device.sprint.model],[TYPE,MOBILE]],[/(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i],[VENDOR,MODEL,[TYPE,TABLET]],[/(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,/(zte)-(\w*)/i,/(alcatel|geeksphone|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]*)/i],[VENDOR,[MODEL,/_/g," "],[TYPE,MOBILE]],[/(nexus\s9)/i],[MODEL,[VENDOR,"HTC"],[TYPE,TABLET]],[/d\/huawei([\w\s-]+)[;\)]/i,/(nexus\s6p)/i],[MODEL,[VENDOR,"Huawei"],[TYPE,MOBILE]],[/(microsoft);\s(lumia[\s\w]+)/i],[VENDOR,MODEL,[TYPE,MOBILE]],[/[\s\(;](xbox(?:\sone)?)[\s\);]/i],[MODEL,[VENDOR,"Microsoft"],[TYPE,CONSOLE]],[/(kin\.[onetw]{3})/i],[[MODEL,/\./g," "],[VENDOR,"Microsoft"],[TYPE,MOBILE]],[/\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?:?(\s4g)?)[\w\s]+build\//i,/mot[\s-]?(\w*)/i,/(XT\d{3,4}) build\//i,/(nexus\s6)/i],[MODEL,[VENDOR,"Motorola"],[TYPE,MOBILE]],[/android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i],[MODEL,[VENDOR,"Motorola"],[TYPE,TABLET]],[/hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i],[[VENDOR,util.trim],[MODEL,util.trim],[TYPE,SMARTTV]],[/hbbtv.+maple;(\d+)/i],[[MODEL,/^/,"SmartTV"],[VENDOR,"Samsung"],[TYPE,SMARTTV]],[/\(dtv[\);].+(aquos)/i],[MODEL,[VENDOR,"Sharp"],[TYPE,SMARTTV]],[/android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,/((SM-T\w+))/i],[[VENDOR,"Samsung"],MODEL,[TYPE,TABLET]],[/smart-tv.+(samsung)/i],[VENDOR,[TYPE,SMARTTV],MODEL],[/((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,/(sam[sung]*)[\s-]*(\w+-?[\w-]*)/i,/sec-((sgh\w+))/i],[[VENDOR,"Samsung"],MODEL,[TYPE,MOBILE]],[/sie-(\w*)/i],[MODEL,[VENDOR,"Siemens"],[TYPE,MOBILE]],[/(maemo|nokia).*(n900|lumia\s\d+)/i,/(nokia)[\s_-]?([\w-]*)/i],[[VENDOR,"Nokia"],MODEL,[TYPE,MOBILE]],[/android\s3\.[\s\w;-]{10}(a\d{3})/i],[MODEL,[VENDOR,"Acer"],[TYPE,TABLET]],[/android.+([vl]k\-?\d{3})\s+build/i],[MODEL,[VENDOR,"LG"],[TYPE,TABLET]],[/android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i],[[VENDOR,"LG"],MODEL,[TYPE,TABLET]],[/(lg) netcast\.tv/i],[VENDOR,MODEL,[TYPE,SMARTTV]],[/(nexus\s[45])/i,/lg[e;\s\/-]+(\w*)/i,/android.+lg(\-?[\d\w]+)\s+build/i],[MODEL,[VENDOR,"LG"],[TYPE,MOBILE]],[/android.+(ideatab[a-z0-9\-\s]+)/i],[MODEL,[VENDOR,"Lenovo"],[TYPE,TABLET]],[/linux;.+((jolla));/i],[VENDOR,MODEL,[TYPE,MOBILE]],[/((pebble))app\/[\d\.]+\s/i],[VENDOR,MODEL,[TYPE,WEARABLE]],[/android.+;\s(oppo)\s?([\w\s]+)\sbuild/i],[VENDOR,MODEL,[TYPE,MOBILE]],[/crkey/i],[[MODEL,"Chromecast"],[VENDOR,"Google"]],[/android.+;\s(glass)\s\d/i],[MODEL,[VENDOR,"Google"],[TYPE,WEARABLE]],[/android.+;\s(pixel c)[\s)]/i],[MODEL,[VENDOR,"Google"],[TYPE,TABLET]],[/android.+;\s(pixel( [23])?( xl)?)\s/i],[MODEL,[VENDOR,"Google"],[TYPE,MOBILE]],[/android.+;\s(\w+)\s+build\/hm\1/i,/android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,/android.+(mi[\s\-_]*(?:one|one[\s_]plus|note lte)?[\s_]*(?:\d?\w?)[\s_]*(?:plus)?)\s+build/i,/android.+(redmi[\s\-_]*(?:note)?(?:[\s_]*[\w\s]+))\s+build/i],[[MODEL,/_/g," "],[VENDOR,"Xiaomi"],[TYPE,MOBILE]],[/android.+(mi[\s\-_]*(?:pad)(?:[\s_]*[\w\s]+))\s+build/i],[[MODEL,/_/g," "],[VENDOR,"Xiaomi"],[TYPE,TABLET]],[/android.+;\s(m[1-5]\snote)\sbuild/i],[MODEL,[VENDOR,"Meizu"],[TYPE,TABLET]],[/(mz)-([\w-]{2,})/i],[[VENDOR,"Meizu"],MODEL,[TYPE,MOBILE]],[/android.+a000(1)\s+build/i,/android.+oneplus\s(a\d{4})\s+build/i],[MODEL,[VENDOR,"OnePlus"],[TYPE,MOBILE]],[/android.+[;\/]\s*(RCT[\d\w]+)\s+build/i],[MODEL,[VENDOR,"RCA"],[TYPE,TABLET]],[/android.+[;\/\s]+(Venue[\d\s]{2,7})\s+build/i],[MODEL,[VENDOR,"Dell"],[TYPE,TABLET]],[/android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i],[MODEL,[VENDOR,"Verizon"],[TYPE,TABLET]],[/android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i],[[VENDOR,"Barnes & Noble"],MODEL,[TYPE,TABLET]],[/android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i],[MODEL,[VENDOR,"NuVision"],[TYPE,TABLET]],[/android.+;\s(k88)\sbuild/i],[MODEL,[VENDOR,"ZTE"],[TYPE,TABLET]],[/android.+[;\/]\s*(gen\d{3})\s+build.*49h/i],[MODEL,[VENDOR,"Swiss"],[TYPE,MOBILE]],[/android.+[;\/]\s*(zur\d{3})\s+build/i],[MODEL,[VENDOR,"Swiss"],[TYPE,TABLET]],[/android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i],[MODEL,[VENDOR,"Zeki"],[TYPE,TABLET]],[/(android).+[;\/]\s+([YR]\d{2})\s+build/i,/android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(\w{5})\sbuild/i],[[VENDOR,"Dragon Touch"],MODEL,[TYPE,TABLET]],[/android.+[;\/]\s*(NS-?\w{0,9})\sbuild/i],[MODEL,[VENDOR,"Insignia"],[TYPE,TABLET]],[/android.+[;\/]\s*((NX|Next)-?\w{0,9})\s+build/i],[MODEL,[VENDOR,"NextBook"],[TYPE,TABLET]],[/android.+[;\/]\s*(Xtreme\_)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i],[[VENDOR,"Voice"],MODEL,[TYPE,MOBILE]],[/android.+[;\/]\s*(LVTEL\-)?(V1[12])\s+build/i],[[VENDOR,"LvTel"],MODEL,[TYPE,MOBILE]],[/android.+;\s(PH-1)\s/i],[MODEL,[VENDOR,"Essential"],[TYPE,MOBILE]],[/android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i],[MODEL,[VENDOR,"Envizen"],[TYPE,TABLET]],[/android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(\w{1,9})\s+build/i],[VENDOR,MODEL,[TYPE,TABLET]],[/android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i],[MODEL,[VENDOR,"MachSpeed"],[TYPE,TABLET]],[/android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i],[VENDOR,MODEL,[TYPE,TABLET]],[/android.+[;\/]\s*TU_(1491)\s+build/i],[MODEL,[VENDOR,"Rotor"],[TYPE,TABLET]],[/android.+(KS(.+))\s+build/i],[MODEL,[VENDOR,"Amazon"],[TYPE,TABLET]],[/android.+(Gigaset)[\s\-]+(Q\w{1,9})\s+build/i],[VENDOR,MODEL,[TYPE,TABLET]],[/\s(tablet|tab)[;\/]/i,/\s(mobile)(?:[;\/]|\ssafari)/i],[[TYPE,util.lowerize],VENDOR,MODEL],[/(android[\w\.\s\-]{0,9});.+build/i],[MODEL,[VENDOR,"Generic"]]],engine:[[/windows.+\sedge\/([\w\.]+)/i],[VERSION,[NAME,"EdgeHTML"]],[/(presto)\/([\w\.]+)/i,/(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,/(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,/(icab)[\/\s]([23]\.[\d\.]+)/i],[NAME,VERSION],[/rv\:([\w\.]{1,9}).+(gecko)/i],[VERSION,NAME]],os:[[/microsoft\s(windows)\s(vista|xp)/i],[NAME,VERSION],[/(windows)\snt\s6\.2;\s(arm)/i,/(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s\w]*)/i,/(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i],[NAME,[VERSION,mapper.str,maps.os.windows.version]],[/(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i],[[NAME,"Windows"],[VERSION,mapper.str,maps.os.windows.version]],[/\((bb)(10);/i],[[NAME,"BlackBerry"],VERSION],[/(blackberry)\w*\/?([\w\.]*)/i,/(tizen)[\/\s]([\w\.]+)/i,/(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]*)/i,/linux;.+(sailfish);/i],[NAME,VERSION],[/(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]*)/i],[[NAME,"Symbian"],VERSION],[/\((series40);/i],[NAME],[/mozilla.+\(mobile;.+gecko.+firefox/i],[[NAME,"Firefox OS"],VERSION],[/(nintendo|playstation)\s([wids34portablevu]+)/i,/(mint)[\/\s\(]?(\w*)/i,/(mageia|vectorlinux)[;\s]/i,/(joli|[kxln]?ubuntu|debian|suse|opensuse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]*)/i,/(hurd|linux)\s?([\w\.]*)/i,/(gnu)\s?([\w\.]*)/i],[NAME,VERSION],[/(cros)\s[\w]+\s([\w\.]+\w)/i],[[NAME,"Chromium OS"],VERSION],[/(sunos)\s?([\w\.\d]*)/i],[[NAME,"Solaris"],VERSION],[/\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]*)/i],[NAME,VERSION],[/(haiku)\s(\w+)/i],[NAME,VERSION],[/cfnetwork\/.+darwin/i,/ip[honead]{2,4}(?:.*os\s([\w]+)\slike\smac|;\sopera)/i],[[VERSION,/_/g,"."],[NAME,"iOS"]],[/(mac\sos\sx)\s?([\w\s\.]*)/i,/(macintosh|mac(?=_powerpc)\s)/i],[[NAME,"Mac OS"],[VERSION,/_/g,"."]],[/((?:open)?solaris)[\/\s-]?([\w\.]*)/i,/(aix)\s((\d)(?=\.|\)|\s)[\w\.])*/i,/(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms|fuchsia)/i,/(unix)\s?([\w\.]*)/i],[NAME,VERSION]]};var UAParser=function(uastring,extensions){if(typeof uastring==="object"){extensions=uastring;uastring=undefined}if(!(this instanceof UAParser)){return new UAParser(uastring,extensions).getResult()}var ua=uastring||(window&&window.navigator&&window.navigator.userAgent?window.navigator.userAgent:EMPTY);var rgxmap=extensions?util.extend(regexes,extensions):regexes;this.getBrowser=function(){var browser={name:undefined,version:undefined};mapper.rgx.call(browser,ua,rgxmap.browser);browser.major=util.major(browser.version);return browser};this.getCPU=function(){var cpu={architecture:undefined};mapper.rgx.call(cpu,ua,rgxmap.cpu);return cpu};this.getDevice=function(){var device={vendor:undefined,model:undefined,type:undefined};mapper.rgx.call(device,ua,rgxmap.device);return device};this.getEngine=function(){var engine={name:undefined,version:undefined};mapper.rgx.call(engine,ua,rgxmap.engine);return engine};this.getOS=function(){var os={name:undefined,version:undefined};mapper.rgx.call(os,ua,rgxmap.os);return os};this.getResult=function(){return{ua:this.getUA(),browser:this.getBrowser(),engine:this.getEngine(),os:this.getOS(),device:this.getDevice(),cpu:this.getCPU()}};this.getUA=function(){return ua};this.setUA=function(uastring){ua=uastring;return this};return this};UAParser.VERSION=LIBVERSION;UAParser.BROWSER={NAME:NAME,MAJOR:MAJOR,VERSION:VERSION};UAParser.CPU={ARCHITECTURE:ARCHITECTURE};UAParser.DEVICE={MODEL:MODEL,VENDOR:VENDOR,TYPE:TYPE,CONSOLE:CONSOLE,MOBILE:MOBILE,SMARTTV:SMARTTV,TABLET:TABLET,WEARABLE:WEARABLE,EMBEDDED:EMBEDDED};UAParser.ENGINE={NAME:NAME,VERSION:VERSION};UAParser.OS={NAME:NAME,VERSION:VERSION};if(typeof exports!==UNDEF_TYPE){if(typeof module!==UNDEF_TYPE&&module.exports){exports=module.exports=UAParser}exports.UAParser=UAParser}else{if(typeof define===FUNC_TYPE&&define.amd){define(function(){return UAParser})}else{if(window){window.UAParser=UAParser}}}var $=window&&(window.jQuery||window.Zepto);if(typeof $!==UNDEF_TYPE&&!$.ua){var parser=new UAParser;$.ua=parser.getResult();$.ua.get=function(){return parser.getUA()};$.ua.set=function(uastring){parser.setUA(uastring);var result=parser.getResult();for(var prop in result){$.ua[prop]=result[prop]}}}})(typeof window==="object"?window:this); return $.ua ? $.ua : new UAParser().getResult();})(),
    }
    var public = {
        data: {
            language: Cloud.language,
            device: Cloud.device,
            sitename: Cloud.sitename,            
            COUNTRY_CODE: Cloud.COUNTRY_CODE,
        },
        utils: utils,
    }
    return public
})(window.Cloud)))
