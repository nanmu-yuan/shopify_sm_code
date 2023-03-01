/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};


let date = getZoneTime(8);
let day = date.day;
let hour = date.hour;
let url = location.href;


  // JavaScript获取指定时区的时间
  function getZoneTime(offset){
    // 取本地时间
    var localtime = new Date();  
    // 取本地毫秒数
    var localmesc = localtime.getTime(); 
    // 取本地时区与格林尼治所在时区的偏差毫秒数
    var localOffset = localtime.getTimezoneOffset() * 60000; 
    // 反推得到格林尼治时间
    var utc = localOffset + localmesc; 
    // 得到指定时区时间
    var calctime = utc + (3600000*offset);  
    var nd = new Date(calctime);  
    // return nd.toDateString()+" "+nd.getHours()+":"+nd.getMinutes()+":"+nd.getSeconds(); 
    //只需要获取hour值
    return {hour:nd.getHours(),day:nd.getDate()};
  }
  
  
//欧洲国家跳转到eu站点
  
// let RedirectedNum = 0;
// let RedirecteUrl = setInterval(()=>{
//   RedirectedNum++;
//   if($('.language-javascript').length>0){
//     let url = $('.language-javascript').find('code').text();
//     location.href = url;   
//     clearInterval(RedirecteUrl);
//   }  
//   if(RedirectedNum>10){
//     clearInterval(RedirecteUrl);
//   }
// },300)

// if(window.localStorage.getItem('IpGeolocationDate')&&window.localStorage.getItem('IpGeolocationDate')!=null&&window.localStorage.getItem('IpGeolocationDate')!=''){
//   let IpGeolocationDate = window.localStorage.getItem('IpGeolocationDate');
//   let nowTimes = new Date().getTime();
//   if(nowTimes - IpGeolocationDate > 60*10*1000){
//     getIpGeolocation()
//   }else{
//     let IpGeolocationData =  window.localStorage.getItem('IpGeolocationData');
//     let res = JSON.parse(IpGeolocationData);
//     // console.log(3,res);
//     console.log('country_code:'+res.country_code3)
//     if(res.country_code3 == 'ITA'||res.country_code3 == 'FRA'){
//         location.href = 'https://eu.thesupermade.com/'
//     }
//   }
// }else{
//   getIpGeolocation()
// }
  
function getIpGeolocation() {
  $.ajax({
    url:'https://api.ipgeolocation.io/ipgeo?apiKey=0bbd662ff4c54380864dd4815c6df594',
    type:'get',
    success:(res)=>{
      // console.log(1,res);
      // if(res.continent_name == "Europe" && res.country_code3 != 'GBR' && res.country_code3 != 'RUS'){
      //   location.href = 'https://eu.thesupermade.com/'
      // }
      let nowTime = new Date().getTime();
      window.localStorage.setItem('IpGeolocationDate',nowTime)
      window.localStorage.setItem('IpGeolocationData',JSON.stringify(res));
      console.log('country_code:'+res.country_code3)
      if(res.country_code3 == 'ITA'||res.country_code3 == 'FRA'){
        location.href = 'https://eu.thesupermade.com/'
      }
    },
    error:(res)=>{
      console.log(2,res)
    },
    
  })
}
  
/******/ })();