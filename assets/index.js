var Lh=Object.defineProperty;var Dh=(i,t,e)=>t in i?Lh(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var K=(i,t,e)=>Dh(i,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=e(r);fetch(r.href,s)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Jo="166",Ih=0,Pl=1,Uh=2,gu=1,Nh=2,Pn=3,Qn=0,De=1,sn=2,Zn=0,Zi=1,Ll=2,Dl=3,Il=4,Fh=5,mi=100,Oh=101,Bh=102,zh=103,kh=104,Hh=200,Gh=201,Vh=202,Wh=203,ao=204,oo=205,Xh=206,qh=207,Yh=208,$h=209,Kh=210,Zh=211,jh=212,Jh=213,Qh=214,td=0,ed=1,nd=2,Hs=3,id=4,rd=5,sd=6,ad=7,_u=0,od=1,ld=2,jn=0,cd=1,ud=2,hd=3,dd=4,fd=5,pd=6,md=7,vu=300,er=301,nr=302,lo=303,co=304,aa=306,Gs=1e3,_i=1001,uo=1002,Te=1003,gd=1004,Yr=1005,an=1006,Sa=1007,vi=1008,Nn=1009,xu=1010,Mu=1011,Cr=1012,Qo=1013,Si=1014,Dn=1015,Ur=1016,tl=1017,el=1018,ir=1020,Su=35902,yu=1021,Eu=1022,on=1023,Tu=1024,bu=1025,ji=1026,rr=1027,Au=1028,nl=1029,wu=1030,il=1031,rl=1033,Ls=33776,Ds=33777,Is=33778,Us=33779,ho=35840,fo=35841,po=35842,mo=35843,go=36196,_o=37492,vo=37496,xo=37808,Mo=37809,So=37810,yo=37811,Eo=37812,To=37813,bo=37814,Ao=37815,wo=37816,Ro=37817,Co=37818,Po=37819,Lo=37820,Do=37821,Ns=36492,Io=36494,Uo=36495,Ru=36283,No=36284,Fo=36285,Oo=36286,_d=3200,vd=3201,xd=0,Md=1,Yn="",mn="srgb",ei="srgb-linear",sl="display-p3",oa="display-p3-linear",Vs="linear",ee="srgb",Ws="rec709",Xs="p3",Ai=7680,Ul=519,Sd=512,yd=513,Ed=514,Cu=515,Td=516,bd=517,Ad=518,wd=519,Bo=35044,Nl="300 es",In=2e3,qs=2001;class or{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const r=this._listeners[t];if(r!==void 0){const s=r.indexOf(e);s!==-1&&r.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,t);t.target=null}}}const be=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Fs=Math.PI/180,zo=180/Math.PI;function Jn(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(be[i&255]+be[i>>8&255]+be[i>>16&255]+be[i>>24&255]+"-"+be[t&255]+be[t>>8&255]+"-"+be[t>>16&15|64]+be[t>>24&255]+"-"+be[e&63|128]+be[e>>8&255]+"-"+be[e>>16&255]+be[e>>24&255]+be[n&255]+be[n>>8&255]+be[n>>16&255]+be[n>>24&255]).toLowerCase()}function Ue(i,t,e){return Math.max(t,Math.min(e,i))}function Rd(i,t){return(i%t+t)%t}function ya(i,t,e){return(1-e)*i+e*t}function _n(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function te(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class kt{constructor(t=0,e=0){kt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6],this.y=r[1]*e+r[4]*n+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ue(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),r=Math.sin(e),s=this.x-t.x,a=this.y-t.y;return this.x=s*n-a*r+t.x,this.y=s*r+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Bt{constructor(t,e,n,r,s,a,o,l,c){Bt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,a,o,l,c)}set(t,e,n,r,s,a,o,l,c){const u=this.elements;return u[0]=t,u[1]=r,u[2]=o,u[3]=e,u[4]=s,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],d=n[7],h=n[2],m=n[5],g=n[8],_=r[0],f=r[3],p=r[6],S=r[1],v=r[4],E=r[7],w=r[2],b=r[5],A=r[8];return s[0]=a*_+o*S+l*w,s[3]=a*f+o*v+l*b,s[6]=a*p+o*E+l*A,s[1]=c*_+u*S+d*w,s[4]=c*f+u*v+d*b,s[7]=c*p+u*E+d*A,s[2]=h*_+m*S+g*w,s[5]=h*f+m*v+g*b,s[8]=h*p+m*E+g*A,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*a*u-e*o*c-n*s*u+n*o*l+r*s*c-r*a*l}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],d=u*a-o*c,h=o*l-u*s,m=c*s-a*l,g=e*d+n*h+r*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return t[0]=d*_,t[1]=(r*c-u*n)*_,t[2]=(o*n-r*a)*_,t[3]=h*_,t[4]=(u*e-r*l)*_,t[5]=(r*s-o*e)*_,t[6]=m*_,t[7]=(n*l-c*e)*_,t[8]=(a*e-n*s)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-r*c,r*l,-r*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(Ea.makeScale(t,e)),this}rotate(t){return this.premultiply(Ea.makeRotation(-t)),this}translate(t,e){return this.premultiply(Ea.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<9;r++)if(e[r]!==n[r])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Ea=new Bt;function Pu(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Ys(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Cd(){const i=Ys("canvas");return i.style.display="block",i}const Fl={};function al(i){i in Fl||(Fl[i]=!0,console.warn(i))}function Pd(i,t,e){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}const Ol=new Bt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Bl=new Bt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),$r={[ei]:{transfer:Vs,primaries:Ws,toReference:i=>i,fromReference:i=>i},[mn]:{transfer:ee,primaries:Ws,toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[oa]:{transfer:Vs,primaries:Xs,toReference:i=>i.applyMatrix3(Bl),fromReference:i=>i.applyMatrix3(Ol)},[sl]:{transfer:ee,primaries:Xs,toReference:i=>i.convertSRGBToLinear().applyMatrix3(Bl),fromReference:i=>i.applyMatrix3(Ol).convertLinearToSRGB()}},Ld=new Set([ei,oa]),jt={enabled:!0,_workingColorSpace:ei,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!Ld.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,t,e){if(this.enabled===!1||t===e||!t||!e)return i;const n=$r[t].toReference,r=$r[e].fromReference;return r(n(i))},fromWorkingColorSpace:function(i,t){return this.convert(i,this._workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this._workingColorSpace)},getPrimaries:function(i){return $r[i].primaries},getTransfer:function(i){return i===Yn?Vs:$r[i].transfer}};function Ji(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ta(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let wi;class Dd{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{wi===void 0&&(wi=Ys("canvas")),wi.width=t.width,wi.height=t.height;const n=wi.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=wi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Ys("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const r=n.getImageData(0,0,t.width,t.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Ji(s[a]/255)*255;return n.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Ji(e[n]/255)*255):e[n]=Ji(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Id=0;class Lu{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Id++}),this.uuid=Jn(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(ba(r[a].image)):s.push(ba(r[a]))}else s=ba(r);n.url=s}return e||(t.images[this.uuid]=n),n}}function ba(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Dd.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Ud=0;class Ie extends or{constructor(t=Ie.DEFAULT_IMAGE,e=Ie.DEFAULT_MAPPING,n=_i,r=_i,s=an,a=vi,o=on,l=Nn,c=Ie.DEFAULT_ANISOTROPY,u=Yn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ud++}),this.uuid=Jn(),this.name="",this.source=new Lu(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new kt(0,0),this.repeat=new kt(1,1),this.center=new kt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Bt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==vu)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Gs:t.x=t.x-Math.floor(t.x);break;case _i:t.x=t.x<0?0:1;break;case uo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Gs:t.y=t.y-Math.floor(t.y);break;case _i:t.y=t.y<0?0:1;break;case uo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Ie.DEFAULT_IMAGE=null;Ie.DEFAULT_MAPPING=vu;Ie.DEFAULT_ANISOTROPY=1;class xe{constructor(t=0,e=0,n=0,r=1){xe.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,r){return this.x=t,this.y=e,this.z=n,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*e+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*e+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*e+a[7]*n+a[11]*r+a[15]*s,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,r,s;const l=t.elements,c=l[0],u=l[4],d=l[8],h=l[1],m=l[5],g=l[9],_=l[2],f=l[6],p=l[10];if(Math.abs(u-h)<.01&&Math.abs(d-_)<.01&&Math.abs(g-f)<.01){if(Math.abs(u+h)<.1&&Math.abs(d+_)<.1&&Math.abs(g+f)<.1&&Math.abs(c+m+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const v=(c+1)/2,E=(m+1)/2,w=(p+1)/2,b=(u+h)/4,A=(d+_)/4,L=(g+f)/4;return v>E&&v>w?v<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(v),r=b/n,s=A/n):E>w?E<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(E),n=b/r,s=L/r):w<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(w),n=A/s,r=L/s),this.set(n,r,s,e),this}let S=Math.sqrt((f-g)*(f-g)+(d-_)*(d-_)+(h-u)*(h-u));return Math.abs(S)<.001&&(S=1),this.x=(f-g)/S,this.y=(d-_)/S,this.z=(h-u)/S,this.w=Math.acos((c+m+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Nd extends or{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new xe(0,0,t,e),this.scissorTest=!1,this.viewport=new xe(0,0,t,e);const r={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:an,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const s=new Ie(r,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=t,this.textures[r].image.height=e,this.textures[r].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,r=t.textures.length;n<r;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Lu(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class yi extends Nd{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Du extends Ie{constructor(t=null,e=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:r},this.magFilter=Te,this.minFilter=Te,this.wrapR=_i,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Fd extends Ie{constructor(t=null,e=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:r},this.magFilter=Te,this.minFilter=Te,this.wrapR=_i,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Nr{constructor(t=0,e=0,n=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=r}static slerpFlat(t,e,n,r,s,a,o){let l=n[r+0],c=n[r+1],u=n[r+2],d=n[r+3];const h=s[a+0],m=s[a+1],g=s[a+2],_=s[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=d;return}if(o===1){t[e+0]=h,t[e+1]=m,t[e+2]=g,t[e+3]=_;return}if(d!==_||l!==h||c!==m||u!==g){let f=1-o;const p=l*h+c*m+u*g+d*_,S=p>=0?1:-1,v=1-p*p;if(v>Number.EPSILON){const w=Math.sqrt(v),b=Math.atan2(w,p*S);f=Math.sin(f*b)/w,o=Math.sin(o*b)/w}const E=o*S;if(l=l*f+h*E,c=c*f+m*E,u=u*f+g*E,d=d*f+_*E,f===1-o){const w=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=w,c*=w,u*=w,d*=w}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,r,s,a){const o=n[r],l=n[r+1],c=n[r+2],u=n[r+3],d=s[a],h=s[a+1],m=s[a+2],g=s[a+3];return t[e]=o*g+u*d+l*m-c*h,t[e+1]=l*g+u*h+c*d-o*m,t[e+2]=c*g+u*m+o*h-l*d,t[e+3]=u*g-o*d-l*h-c*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,r){return this._x=t,this._y=e,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,r=t._y,s=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(r/2),d=o(s/2),h=l(n/2),m=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=h*u*d+c*m*g,this._y=c*m*d-h*u*g,this._z=c*u*g+h*m*d,this._w=c*u*d-h*m*g;break;case"YXZ":this._x=h*u*d+c*m*g,this._y=c*m*d-h*u*g,this._z=c*u*g-h*m*d,this._w=c*u*d+h*m*g;break;case"ZXY":this._x=h*u*d-c*m*g,this._y=c*m*d+h*u*g,this._z=c*u*g+h*m*d,this._w=c*u*d-h*m*g;break;case"ZYX":this._x=h*u*d-c*m*g,this._y=c*m*d+h*u*g,this._z=c*u*g-h*m*d,this._w=c*u*d+h*m*g;break;case"YZX":this._x=h*u*d+c*m*g,this._y=c*m*d+h*u*g,this._z=c*u*g-h*m*d,this._w=c*u*d-h*m*g;break;case"XZY":this._x=h*u*d-c*m*g,this._y=c*m*d-h*u*g,this._z=c*u*g+h*m*d,this._w=c*u*d+h*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,r=Math.sin(n);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],r=e[4],s=e[8],a=e[1],o=e[5],l=e[9],c=e[2],u=e[6],d=e[10],h=n+o+d;if(h>0){const m=.5/Math.sqrt(h+1);this._w=.25/m,this._x=(u-l)*m,this._y=(s-c)*m,this._z=(a-r)*m}else if(n>o&&n>d){const m=2*Math.sqrt(1+n-o-d);this._w=(u-l)/m,this._x=.25*m,this._y=(r+a)/m,this._z=(s+c)/m}else if(o>d){const m=2*Math.sqrt(1+o-n-d);this._w=(s-c)/m,this._x=(r+a)/m,this._y=.25*m,this._z=(l+u)/m}else{const m=2*Math.sqrt(1+d-n-o);this._w=(a-r)/m,this._x=(s+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ue(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const r=Math.min(1,e/n);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,r=t._y,s=t._z,a=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+a*o+r*c-s*l,this._y=r*u+a*l+s*o-n*c,this._z=s*u+a*c+n*l-r*o,this._w=a*u-n*o-r*l-s*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,r=this._y,s=this._z,a=this._w;let o=a*t._w+n*t._x+r*t._y+s*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=r,this._z=s,this;const l=1-o*o;if(l<=Number.EPSILON){const m=1-e;return this._w=m*a+e*this._w,this._x=m*n+e*this._x,this._y=m*r+e*this._y,this._z=m*s+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,o),d=Math.sin((1-e)*u)/c,h=Math.sin(e*u)/c;return this._w=a*d+this._w*h,this._x=n*d+this._x*h,this._y=r*d+this._y*h,this._z=s*d+this._z*h,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(t),r*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class N{constructor(t=0,e=0,n=0){N.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(zl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(zl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*r,this.y=s[1]*e+s[4]*n+s[7]*r,this.z=s[2]*e+s[5]*n+s[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=t.elements,a=1/(s[3]*e+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*e+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*e+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,r=this.z,s=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*r-o*n),u=2*(o*e-s*r),d=2*(s*n-a*e);return this.x=e+l*c+a*d-o*u,this.y=n+l*u+o*c-s*d,this.z=r+l*d+s*u-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*r,this.y=s[1]*e+s[5]*n+s[9]*r,this.z=s[2]*e+s[6]*n+s[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,r=t.y,s=t.z,a=e.x,o=e.y,l=e.z;return this.x=r*l-s*o,this.y=s*a-n*l,this.z=n*o-r*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Aa.copy(this).projectOnVector(t),this.sub(Aa)}reflect(t){return this.sub(Aa.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ue(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,r=this.z-t.z;return e*e+n*n+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const r=Math.sin(e)*t;return this.x=r*Math.sin(n),this.y=Math.cos(e)*t,this.z=r*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Aa=new N,zl=new Nr;class Fr{constructor(t=new N(1/0,1/0,1/0),e=new N(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(je.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(je.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=je.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,je):je.fromBufferAttribute(s,a),je.applyMatrix4(t.matrixWorld),this.expandByPoint(je);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Kr.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Kr.copy(n.boundingBox)),Kr.applyMatrix4(t.matrixWorld),this.union(Kr)}const r=t.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,je),je.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ur),Zr.subVectors(this.max,ur),Ri.subVectors(t.a,ur),Ci.subVectors(t.b,ur),Pi.subVectors(t.c,ur),zn.subVectors(Ci,Ri),kn.subVectors(Pi,Ci),ri.subVectors(Ri,Pi);let e=[0,-zn.z,zn.y,0,-kn.z,kn.y,0,-ri.z,ri.y,zn.z,0,-zn.x,kn.z,0,-kn.x,ri.z,0,-ri.x,-zn.y,zn.x,0,-kn.y,kn.x,0,-ri.y,ri.x,0];return!wa(e,Ri,Ci,Pi,Zr)||(e=[1,0,0,0,1,0,0,0,1],!wa(e,Ri,Ci,Pi,Zr))?!1:(jr.crossVectors(zn,kn),e=[jr.x,jr.y,jr.z],wa(e,Ri,Ci,Pi,Zr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,je).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(je).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(yn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),yn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),yn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),yn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),yn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),yn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),yn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),yn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(yn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const yn=[new N,new N,new N,new N,new N,new N,new N,new N],je=new N,Kr=new Fr,Ri=new N,Ci=new N,Pi=new N,zn=new N,kn=new N,ri=new N,ur=new N,Zr=new N,jr=new N,si=new N;function wa(i,t,e,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){si.fromArray(i,s);const o=r.x*Math.abs(si.x)+r.y*Math.abs(si.y)+r.z*Math.abs(si.z),l=t.dot(si),c=e.dot(si),u=n.dot(si);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const Od=new Fr,hr=new N,Ra=new N;class Or{constructor(t=new N,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Od.setFromPoints(t).getCenter(n);let r=0;for(let s=0,a=t.length;s<a;s++)r=Math.max(r,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;hr.subVectors(t,this.center);const e=hr.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),r=(n-this.radius)*.5;this.center.addScaledVector(hr,r/n),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ra.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(hr.copy(t.center).add(Ra)),this.expandByPoint(hr.copy(t.center).sub(Ra))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const En=new N,Ca=new N,Jr=new N,Hn=new N,Pa=new N,Qr=new N,La=new N;class ol{constructor(t=new N,e=new N(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,En)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=En.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(En.copy(this.origin).addScaledVector(this.direction,e),En.distanceToSquared(t))}distanceSqToSegment(t,e,n,r){Ca.copy(t).add(e).multiplyScalar(.5),Jr.copy(e).sub(t).normalize(),Hn.copy(this.origin).sub(Ca);const s=t.distanceTo(e)*.5,a=-this.direction.dot(Jr),o=Hn.dot(this.direction),l=-Hn.dot(Jr),c=Hn.lengthSq(),u=Math.abs(1-a*a);let d,h,m,g;if(u>0)if(d=a*l-o,h=a*o-l,g=s*u,d>=0)if(h>=-g)if(h<=g){const _=1/u;d*=_,h*=_,m=d*(d+a*h+2*o)+h*(a*d+h+2*l)+c}else h=s,d=Math.max(0,-(a*h+o)),m=-d*d+h*(h+2*l)+c;else h=-s,d=Math.max(0,-(a*h+o)),m=-d*d+h*(h+2*l)+c;else h<=-g?(d=Math.max(0,-(-a*s+o)),h=d>0?-s:Math.min(Math.max(-s,-l),s),m=-d*d+h*(h+2*l)+c):h<=g?(d=0,h=Math.min(Math.max(-s,-l),s),m=h*(h+2*l)+c):(d=Math.max(0,-(a*s+o)),h=d>0?s:Math.min(Math.max(-s,-l),s),m=-d*d+h*(h+2*l)+c);else h=a>0?-s:s,d=Math.max(0,-(a*h+o)),m=-d*d+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(Ca).addScaledVector(Jr,h),m}intersectSphere(t,e){En.subVectors(t.center,this.origin);const n=En.dot(this.direction),r=En.dot(En)-n*n,s=t.radius*t.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,r,s,a,o,l;const c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,h=this.origin;return c>=0?(n=(t.min.x-h.x)*c,r=(t.max.x-h.x)*c):(n=(t.max.x-h.x)*c,r=(t.min.x-h.x)*c),u>=0?(s=(t.min.y-h.y)*u,a=(t.max.y-h.y)*u):(s=(t.max.y-h.y)*u,a=(t.min.y-h.y)*u),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),d>=0?(o=(t.min.z-h.z)*d,l=(t.max.z-h.z)*d):(o=(t.max.z-h.z)*d,l=(t.min.z-h.z)*d),n>l||o>r)||((o>n||n!==n)&&(n=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(n>=0?n:r,e)}intersectsBox(t){return this.intersectBox(t,En)!==null}intersectTriangle(t,e,n,r,s){Pa.subVectors(e,t),Qr.subVectors(n,t),La.crossVectors(Pa,Qr);let a=this.direction.dot(La),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Hn.subVectors(this.origin,t);const l=o*this.direction.dot(Qr.crossVectors(Hn,Qr));if(l<0)return null;const c=o*this.direction.dot(Pa.cross(Hn));if(c<0||l+c>a)return null;const u=-o*Hn.dot(La);return u<0?null:this.at(u/a,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ce{constructor(t,e,n,r,s,a,o,l,c,u,d,h,m,g,_,f){ce.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,a,o,l,c,u,d,h,m,g,_,f)}set(t,e,n,r,s,a,o,l,c,u,d,h,m,g,_,f){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=u,p[10]=d,p[14]=h,p[3]=m,p[7]=g,p[11]=_,p[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ce().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,r=1/Li.setFromMatrixColumn(t,0).length(),s=1/Li.setFromMatrixColumn(t,1).length(),a=1/Li.setFromMatrixColumn(t,2).length();return e[0]=n[0]*r,e[1]=n[1]*r,e[2]=n[2]*r,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,r=t.y,s=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),d=Math.sin(s);if(t.order==="XYZ"){const h=a*u,m=a*d,g=o*u,_=o*d;e[0]=l*u,e[4]=-l*d,e[8]=c,e[1]=m+g*c,e[5]=h-_*c,e[9]=-o*l,e[2]=_-h*c,e[6]=g+m*c,e[10]=a*l}else if(t.order==="YXZ"){const h=l*u,m=l*d,g=c*u,_=c*d;e[0]=h+_*o,e[4]=g*o-m,e[8]=a*c,e[1]=a*d,e[5]=a*u,e[9]=-o,e[2]=m*o-g,e[6]=_+h*o,e[10]=a*l}else if(t.order==="ZXY"){const h=l*u,m=l*d,g=c*u,_=c*d;e[0]=h-_*o,e[4]=-a*d,e[8]=g+m*o,e[1]=m+g*o,e[5]=a*u,e[9]=_-h*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const h=a*u,m=a*d,g=o*u,_=o*d;e[0]=l*u,e[4]=g*c-m,e[8]=h*c+_,e[1]=l*d,e[5]=_*c+h,e[9]=m*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const h=a*l,m=a*c,g=o*l,_=o*c;e[0]=l*u,e[4]=_-h*d,e[8]=g*d+m,e[1]=d,e[5]=a*u,e[9]=-o*u,e[2]=-c*u,e[6]=m*d+g,e[10]=h-_*d}else if(t.order==="XZY"){const h=a*l,m=a*c,g=o*l,_=o*c;e[0]=l*u,e[4]=-d,e[8]=c*u,e[1]=h*d+_,e[5]=a*u,e[9]=m*d-g,e[2]=g*d-m,e[6]=o*u,e[10]=_*d+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Bd,t,zd)}lookAt(t,e,n){const r=this.elements;return ke.subVectors(t,e),ke.lengthSq()===0&&(ke.z=1),ke.normalize(),Gn.crossVectors(n,ke),Gn.lengthSq()===0&&(Math.abs(n.z)===1?ke.x+=1e-4:ke.z+=1e-4,ke.normalize(),Gn.crossVectors(n,ke)),Gn.normalize(),ts.crossVectors(ke,Gn),r[0]=Gn.x,r[4]=ts.x,r[8]=ke.x,r[1]=Gn.y,r[5]=ts.y,r[9]=ke.y,r[2]=Gn.z,r[6]=ts.z,r[10]=ke.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],d=n[5],h=n[9],m=n[13],g=n[2],_=n[6],f=n[10],p=n[14],S=n[3],v=n[7],E=n[11],w=n[15],b=r[0],A=r[4],L=r[8],T=r[12],x=r[1],P=r[5],z=r[9],F=r[13],H=r[2],q=r[6],V=r[10],Q=r[14],G=r[3],ht=r[7],ct=r[11],dt=r[15];return s[0]=a*b+o*x+l*H+c*G,s[4]=a*A+o*P+l*q+c*ht,s[8]=a*L+o*z+l*V+c*ct,s[12]=a*T+o*F+l*Q+c*dt,s[1]=u*b+d*x+h*H+m*G,s[5]=u*A+d*P+h*q+m*ht,s[9]=u*L+d*z+h*V+m*ct,s[13]=u*T+d*F+h*Q+m*dt,s[2]=g*b+_*x+f*H+p*G,s[6]=g*A+_*P+f*q+p*ht,s[10]=g*L+_*z+f*V+p*ct,s[14]=g*T+_*F+f*Q+p*dt,s[3]=S*b+v*x+E*H+w*G,s[7]=S*A+v*P+E*q+w*ht,s[11]=S*L+v*z+E*V+w*ct,s[15]=S*T+v*F+E*Q+w*dt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],r=t[8],s=t[12],a=t[1],o=t[5],l=t[9],c=t[13],u=t[2],d=t[6],h=t[10],m=t[14],g=t[3],_=t[7],f=t[11],p=t[15];return g*(+s*l*d-r*c*d-s*o*h+n*c*h+r*o*m-n*l*m)+_*(+e*l*m-e*c*h+s*a*h-r*a*m+r*c*u-s*l*u)+f*(+e*c*d-e*o*m-s*a*d+n*a*m+s*o*u-n*c*u)+p*(-r*o*u-e*l*d+e*o*h+r*a*d-n*a*h+n*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],d=t[9],h=t[10],m=t[11],g=t[12],_=t[13],f=t[14],p=t[15],S=d*f*c-_*h*c+_*l*m-o*f*m-d*l*p+o*h*p,v=g*h*c-u*f*c-g*l*m+a*f*m+u*l*p-a*h*p,E=u*_*c-g*d*c+g*o*m-a*_*m-u*o*p+a*d*p,w=g*d*l-u*_*l-g*o*h+a*_*h+u*o*f-a*d*f,b=e*S+n*v+r*E+s*w;if(b===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/b;return t[0]=S*A,t[1]=(_*h*s-d*f*s-_*r*m+n*f*m+d*r*p-n*h*p)*A,t[2]=(o*f*s-_*l*s+_*r*c-n*f*c-o*r*p+n*l*p)*A,t[3]=(d*l*s-o*h*s-d*r*c+n*h*c+o*r*m-n*l*m)*A,t[4]=v*A,t[5]=(u*f*s-g*h*s+g*r*m-e*f*m-u*r*p+e*h*p)*A,t[6]=(g*l*s-a*f*s-g*r*c+e*f*c+a*r*p-e*l*p)*A,t[7]=(a*h*s-u*l*s+u*r*c-e*h*c-a*r*m+e*l*m)*A,t[8]=E*A,t[9]=(g*d*s-u*_*s-g*n*m+e*_*m+u*n*p-e*d*p)*A,t[10]=(a*_*s-g*o*s+g*n*c-e*_*c-a*n*p+e*o*p)*A,t[11]=(u*o*s-a*d*s-u*n*c+e*d*c+a*n*m-e*o*m)*A,t[12]=w*A,t[13]=(u*_*r-g*d*r+g*n*h-e*_*h-u*n*f+e*d*f)*A,t[14]=(g*o*r-a*_*r-g*n*l+e*_*l+a*n*f-e*o*f)*A,t[15]=(a*d*r-u*o*r+u*n*l-e*d*l-a*n*h+e*o*h)*A,this}scale(t){const e=this.elements,n=t.x,r=t.y,s=t.z;return e[0]*=n,e[4]*=r,e[8]*=s,e[1]*=n,e[5]*=r,e[9]*=s,e[2]*=n,e[6]*=r,e[10]*=s,e[3]*=n,e[7]*=r,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,r))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),r=Math.sin(e),s=1-n,a=t.x,o=t.y,l=t.z,c=s*a,u=s*o;return this.set(c*a+n,c*o-r*l,c*l+r*o,0,c*o+r*l,u*o+n,u*l-r*a,0,c*l-r*o,u*l+r*a,s*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,r,s,a){return this.set(1,n,s,0,t,1,a,0,e,r,1,0,0,0,0,1),this}compose(t,e,n){const r=this.elements,s=e._x,a=e._y,o=e._z,l=e._w,c=s+s,u=a+a,d=o+o,h=s*c,m=s*u,g=s*d,_=a*u,f=a*d,p=o*d,S=l*c,v=l*u,E=l*d,w=n.x,b=n.y,A=n.z;return r[0]=(1-(_+p))*w,r[1]=(m+E)*w,r[2]=(g-v)*w,r[3]=0,r[4]=(m-E)*b,r[5]=(1-(h+p))*b,r[6]=(f+S)*b,r[7]=0,r[8]=(g+v)*A,r[9]=(f-S)*A,r[10]=(1-(h+_))*A,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,n){const r=this.elements;let s=Li.set(r[0],r[1],r[2]).length();const a=Li.set(r[4],r[5],r[6]).length(),o=Li.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),t.x=r[12],t.y=r[13],t.z=r[14],Je.copy(this);const c=1/s,u=1/a,d=1/o;return Je.elements[0]*=c,Je.elements[1]*=c,Je.elements[2]*=c,Je.elements[4]*=u,Je.elements[5]*=u,Je.elements[6]*=u,Je.elements[8]*=d,Je.elements[9]*=d,Je.elements[10]*=d,e.setFromRotationMatrix(Je),n.x=s,n.y=a,n.z=o,this}makePerspective(t,e,n,r,s,a,o=In){const l=this.elements,c=2*s/(e-t),u=2*s/(n-r),d=(e+t)/(e-t),h=(n+r)/(n-r);let m,g;if(o===In)m=-(a+s)/(a-s),g=-2*a*s/(a-s);else if(o===qs)m=-a/(a-s),g=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=u,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,r,s,a,o=In){const l=this.elements,c=1/(e-t),u=1/(n-r),d=1/(a-s),h=(e+t)*c,m=(n+r)*u;let g,_;if(o===In)g=(a+s)*d,_=-2*d;else if(o===qs)g=s*d,_=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-h,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<16;r++)if(e[r]!==n[r])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Li=new N,Je=new ce,Bd=new N(0,0,0),zd=new N(1,1,1),Gn=new N,ts=new N,ke=new N,kl=new ce,Hl=new Nr;class Fn{constructor(t=0,e=0,n=0,r=Fn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,r=this._order){return this._x=t,this._y=e,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const r=t.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],u=r[9],d=r[2],h=r[6],m=r[10];switch(e){case"XYZ":this._y=Math.asin(Ue(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ue(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ue(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,m),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Ue(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,m),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ue(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Ue(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return kl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(kl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Hl.setFromEuler(this),this.setFromQuaternion(Hl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Fn.DEFAULT_ORDER="XYZ";class Iu{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let kd=0;const Gl=new N,Di=new Nr,Tn=new ce,es=new N,dr=new N,Hd=new N,Gd=new Nr,Vl=new N(1,0,0),Wl=new N(0,1,0),Xl=new N(0,0,1),ql={type:"added"},Vd={type:"removed"},Ii={type:"childadded",child:null},Da={type:"childremoved",child:null};class Re extends or{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:kd++}),this.uuid=Jn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Re.DEFAULT_UP.clone();const t=new N,e=new Fn,n=new Nr,r=new N(1,1,1);function s(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ce},normalMatrix:{value:new Bt}}),this.matrix=new ce,this.matrixWorld=new ce,this.matrixAutoUpdate=Re.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Re.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Iu,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Di.setFromAxisAngle(t,e),this.quaternion.multiply(Di),this}rotateOnWorldAxis(t,e){return Di.setFromAxisAngle(t,e),this.quaternion.premultiply(Di),this}rotateX(t){return this.rotateOnAxis(Vl,t)}rotateY(t){return this.rotateOnAxis(Wl,t)}rotateZ(t){return this.rotateOnAxis(Xl,t)}translateOnAxis(t,e){return Gl.copy(t).applyQuaternion(this.quaternion),this.position.add(Gl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Vl,t)}translateY(t){return this.translateOnAxis(Wl,t)}translateZ(t){return this.translateOnAxis(Xl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Tn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?es.copy(t):es.set(t,e,n);const r=this.parent;this.updateWorldMatrix(!0,!1),dr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Tn.lookAt(dr,es,this.up):Tn.lookAt(es,dr,this.up),this.quaternion.setFromRotationMatrix(Tn),r&&(Tn.extractRotation(r.matrixWorld),Di.setFromRotationMatrix(Tn),this.quaternion.premultiply(Di.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ql),Ii.child=t,this.dispatchEvent(Ii),Ii.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Vd),Da.child=t,this.dispatchEvent(Da),Da.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Tn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Tn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Tn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ql),Ii.child=t,this.dispatchEvent(Ii),Ii.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(dr,t,Hd),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(dr,Gd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const d=l[c];s(t.shapes,d)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(t.materials,this.material[l]));r.material=o}else r.material=s(t.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),u=a(t.images),d=a(t.shapes),h=a(t.skeletons),m=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),d.length>0&&(n.shapes=d),h.length>0&&(n.skeletons=h),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=r,n;function a(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const r=t.children[n];this.add(r.clone())}return this}}Re.DEFAULT_UP=new N(0,1,0);Re.DEFAULT_MATRIX_AUTO_UPDATE=!0;Re.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Qe=new N,bn=new N,Ia=new N,An=new N,Ui=new N,Ni=new N,Yl=new N,Ua=new N,Na=new N,Fa=new N;class Ye{constructor(t=new N,e=new N,n=new N){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,r){r.subVectors(n,e),Qe.subVectors(t,e),r.cross(Qe);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(t,e,n,r,s){Qe.subVectors(r,e),bn.subVectors(n,e),Ia.subVectors(t,e);const a=Qe.dot(Qe),o=Qe.dot(bn),l=Qe.dot(Ia),c=bn.dot(bn),u=bn.dot(Ia),d=a*c-o*o;if(d===0)return s.set(0,0,0),null;const h=1/d,m=(c*l-o*u)*h,g=(a*u-o*l)*h;return s.set(1-m-g,g,m)}static containsPoint(t,e,n,r){return this.getBarycoord(t,e,n,r,An)===null?!1:An.x>=0&&An.y>=0&&An.x+An.y<=1}static getInterpolation(t,e,n,r,s,a,o,l){return this.getBarycoord(t,e,n,r,An)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,An.x),l.addScaledVector(a,An.y),l.addScaledVector(o,An.z),l)}static isFrontFacing(t,e,n,r){return Qe.subVectors(n,e),bn.subVectors(t,e),Qe.cross(bn).dot(r)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,r){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,n,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Qe.subVectors(this.c,this.b),bn.subVectors(this.a,this.b),Qe.cross(bn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Ye.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Ye.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,r,s){return Ye.getInterpolation(t,this.a,this.b,this.c,e,n,r,s)}containsPoint(t){return Ye.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Ye.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,r=this.b,s=this.c;let a,o;Ui.subVectors(r,n),Ni.subVectors(s,n),Ua.subVectors(t,n);const l=Ui.dot(Ua),c=Ni.dot(Ua);if(l<=0&&c<=0)return e.copy(n);Na.subVectors(t,r);const u=Ui.dot(Na),d=Ni.dot(Na);if(u>=0&&d<=u)return e.copy(r);const h=l*d-u*c;if(h<=0&&l>=0&&u<=0)return a=l/(l-u),e.copy(n).addScaledVector(Ui,a);Fa.subVectors(t,s);const m=Ui.dot(Fa),g=Ni.dot(Fa);if(g>=0&&m<=g)return e.copy(s);const _=m*c-l*g;if(_<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(Ni,o);const f=u*g-m*d;if(f<=0&&d-u>=0&&m-g>=0)return Yl.subVectors(s,r),o=(d-u)/(d-u+(m-g)),e.copy(r).addScaledVector(Yl,o);const p=1/(f+_+h);return a=_*p,o=h*p,e.copy(n).addScaledVector(Ui,a).addScaledVector(Ni,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Uu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Vn={h:0,s:0,l:0},ns={h:0,s:0,l:0};function Oa(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Gt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=mn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,jt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,r=jt.workingColorSpace){return this.r=t,this.g=e,this.b=n,jt.toWorkingColorSpace(this,r),this}setHSL(t,e,n,r=jt.workingColorSpace){if(t=Rd(t,1),e=Ue(e,0,1),n=Ue(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,a=2*n-s;this.r=Oa(a,s,t+1/3),this.g=Oa(a,s,t),this.b=Oa(a,s,t-1/3)}return jt.toWorkingColorSpace(this,r),this}setStyle(t,e=mn){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=mn){const n=Uu[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ji(t.r),this.g=Ji(t.g),this.b=Ji(t.b),this}copyLinearToSRGB(t){return this.r=Ta(t.r),this.g=Ta(t.g),this.b=Ta(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=mn){return jt.fromWorkingColorSpace(Ae.copy(this),t),Math.round(Ue(Ae.r*255,0,255))*65536+Math.round(Ue(Ae.g*255,0,255))*256+Math.round(Ue(Ae.b*255,0,255))}getHexString(t=mn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=jt.workingColorSpace){jt.fromWorkingColorSpace(Ae.copy(this),e);const n=Ae.r,r=Ae.g,s=Ae.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let l,c;const u=(o+a)/2;if(o===a)l=0,c=0;else{const d=a-o;switch(c=u<=.5?d/(a+o):d/(2-a-o),a){case n:l=(r-s)/d+(r<s?6:0);break;case r:l=(s-n)/d+2;break;case s:l=(n-r)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=jt.workingColorSpace){return jt.fromWorkingColorSpace(Ae.copy(this),e),t.r=Ae.r,t.g=Ae.g,t.b=Ae.b,t}getStyle(t=mn){jt.fromWorkingColorSpace(Ae.copy(this),t);const e=Ae.r,n=Ae.g,r=Ae.b;return t!==mn?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(t,e,n){return this.getHSL(Vn),this.setHSL(Vn.h+t,Vn.s+e,Vn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Vn),t.getHSL(ns);const n=ya(Vn.h,ns.h,e),r=ya(Vn.s,ns.s,e),s=ya(Vn.l,ns.l,e);return this.setHSL(n,r,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,r=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*r,this.g=s[1]*e+s[4]*n+s[7]*r,this.b=s[2]*e+s[5]*n+s[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ae=new Gt;Gt.NAMES=Uu;let Wd=0;class Ei extends or{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Wd++}),this.uuid=Jn(),this.name="",this.type="Material",this.blending=Zi,this.side=Qn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ao,this.blendDst=oo,this.blendEquation=mi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Gt(0,0,0),this.blendAlpha=0,this.depthFunc=Hs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ul,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ai,this.stencilZFail=Ai,this.stencilZPass=Ai,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Zi&&(n.blending=this.blending),this.side!==Qn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ao&&(n.blendSrc=this.blendSrc),this.blendDst!==oo&&(n.blendDst=this.blendDst),this.blendEquation!==mi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Hs&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ul&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ai&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ai&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ai&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(e){const s=r(t.textures),a=r(t.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const r=e.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}onBeforeRender(){console.warn("Material: onBeforeRender() has been removed.")}}class ni extends Ei{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Gt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Fn,this.combine=_u,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const pe=new N,is=new kt;class Me{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Bo,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Dn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return al("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[t+r]=e.array[n+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)is.fromBufferAttribute(this,e),is.applyMatrix3(t),this.setXY(e,is.x,is.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.applyMatrix3(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.applyMatrix4(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.applyNormalMatrix(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)pe.fromBufferAttribute(this,e),pe.transformDirection(t),this.setXYZ(e,pe.x,pe.y,pe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=_n(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=te(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=_n(e,this.array)),e}setX(t,e){return this.normalized&&(e=te(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=_n(e,this.array)),e}setY(t,e){return this.normalized&&(e=te(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=_n(e,this.array)),e}setZ(t,e){return this.normalized&&(e=te(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=_n(e,this.array)),e}setW(t,e){return this.normalized&&(e=te(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=te(e,this.array),n=te(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,r){return t*=this.itemSize,this.normalized&&(e=te(e,this.array),n=te(n,this.array),r=te(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this}setXYZW(t,e,n,r,s){return t*=this.itemSize,this.normalized&&(e=te(e,this.array),n=te(n,this.array),r=te(r,this.array),s=te(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Bo&&(t.usage=this.usage),t}}class Nu extends Me{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Fu extends Me{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Ve extends Me{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Xd=0;const Xe=new ce,Ba=new Re,Fi=new N,He=new Fr,fr=new Fr,ve=new N;class Oe extends or{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Xd++}),this.uuid=Jn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Pu(t)?Fu:Nu)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Bt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Xe.makeRotationFromQuaternion(t),this.applyMatrix4(Xe),this}rotateX(t){return Xe.makeRotationX(t),this.applyMatrix4(Xe),this}rotateY(t){return Xe.makeRotationY(t),this.applyMatrix4(Xe),this}rotateZ(t){return Xe.makeRotationZ(t),this.applyMatrix4(Xe),this}translate(t,e,n){return Xe.makeTranslation(t,e,n),this.applyMatrix4(Xe),this}scale(t,e,n){return Xe.makeScale(t,e,n),this.applyMatrix4(Xe),this}lookAt(t){return Ba.lookAt(t),Ba.updateMatrix(),this.applyMatrix4(Ba.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Fi).negate(),this.translate(Fi.x,Fi.y,Fi.z),this}setFromPoints(t){const e=[];for(let n=0,r=t.length;n<r;n++){const s=t[n];e.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new Ve(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Fr);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new N(-1/0,-1/0,-1/0),new N(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,r=e.length;n<r;n++){const s=e[n];He.setFromBufferAttribute(s),this.morphTargetsRelative?(ve.addVectors(this.boundingBox.min,He.min),this.boundingBox.expandByPoint(ve),ve.addVectors(this.boundingBox.max,He.max),this.boundingBox.expandByPoint(ve)):(this.boundingBox.expandByPoint(He.min),this.boundingBox.expandByPoint(He.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Or);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new N,1/0);return}if(t){const n=this.boundingSphere.center;if(He.setFromBufferAttribute(t),e)for(let s=0,a=e.length;s<a;s++){const o=e[s];fr.setFromBufferAttribute(o),this.morphTargetsRelative?(ve.addVectors(He.min,fr.min),He.expandByPoint(ve),ve.addVectors(He.max,fr.max),He.expandByPoint(ve)):(He.expandByPoint(fr.min),He.expandByPoint(fr.max))}He.getCenter(n);let r=0;for(let s=0,a=t.count;s<a;s++)ve.fromBufferAttribute(t,s),r=Math.max(r,n.distanceToSquared(ve));if(e)for(let s=0,a=e.length;s<a;s++){const o=e[s],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)ve.fromBufferAttribute(o,c),l&&(Fi.fromBufferAttribute(t,c),ve.add(Fi)),r=Math.max(r,n.distanceToSquared(ve))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,r=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Me(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let L=0;L<n.count;L++)o[L]=new N,l[L]=new N;const c=new N,u=new N,d=new N,h=new kt,m=new kt,g=new kt,_=new N,f=new N;function p(L,T,x){c.fromBufferAttribute(n,L),u.fromBufferAttribute(n,T),d.fromBufferAttribute(n,x),h.fromBufferAttribute(s,L),m.fromBufferAttribute(s,T),g.fromBufferAttribute(s,x),u.sub(c),d.sub(c),m.sub(h),g.sub(h);const P=1/(m.x*g.y-g.x*m.y);isFinite(P)&&(_.copy(u).multiplyScalar(g.y).addScaledVector(d,-m.y).multiplyScalar(P),f.copy(d).multiplyScalar(m.x).addScaledVector(u,-g.x).multiplyScalar(P),o[L].add(_),o[T].add(_),o[x].add(_),l[L].add(f),l[T].add(f),l[x].add(f))}let S=this.groups;S.length===0&&(S=[{start:0,count:t.count}]);for(let L=0,T=S.length;L<T;++L){const x=S[L],P=x.start,z=x.count;for(let F=P,H=P+z;F<H;F+=3)p(t.getX(F+0),t.getX(F+1),t.getX(F+2))}const v=new N,E=new N,w=new N,b=new N;function A(L){w.fromBufferAttribute(r,L),b.copy(w);const T=o[L];v.copy(T),v.sub(w.multiplyScalar(w.dot(T))).normalize(),E.crossVectors(b,T);const P=E.dot(l[L])<0?-1:1;a.setXYZW(L,v.x,v.y,v.z,P)}for(let L=0,T=S.length;L<T;++L){const x=S[L],P=x.start,z=x.count;for(let F=P,H=P+z;F<H;F+=3)A(t.getX(F+0)),A(t.getX(F+1)),A(t.getX(F+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Me(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,m=n.count;h<m;h++)n.setXYZ(h,0,0,0);const r=new N,s=new N,a=new N,o=new N,l=new N,c=new N,u=new N,d=new N;if(t)for(let h=0,m=t.count;h<m;h+=3){const g=t.getX(h+0),_=t.getX(h+1),f=t.getX(h+2);r.fromBufferAttribute(e,g),s.fromBufferAttribute(e,_),a.fromBufferAttribute(e,f),u.subVectors(a,s),d.subVectors(r,s),u.cross(d),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,f),o.add(u),l.add(u),c.add(u),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(f,c.x,c.y,c.z)}else for(let h=0,m=e.count;h<m;h+=3)r.fromBufferAttribute(e,h+0),s.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),u.subVectors(a,s),d.subVectors(r,s),u.cross(d),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)ve.fromBufferAttribute(t,e),ve.normalize(),t.setXYZ(e,ve.x,ve.y,ve.z)}toNonIndexed(){function t(o,l){const c=o.array,u=o.itemSize,d=o.normalized,h=new c.constructor(l.length*u);let m=0,g=0;for(let _=0,f=l.length;_<f;_++){o.isInterleavedBufferAttribute?m=l[_]*o.data.stride+o.offset:m=l[_]*u;for(let p=0;p<u;p++)h[g++]=c[m++]}return new Me(h,u,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Oe,n=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=t(l,n);e.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let u=0,d=c.length;u<d;u++){const h=c[u],m=t(h,n);l.push(m)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let d=0,h=c.length;d<h;d++){const m=c[d];u.push(m.toJSON(t.data))}u.length>0&&(r[l]=u,s=!0)}s&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const r=t.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(e))}const s=t.morphAttributes;for(const c in s){const u=[],d=s[c];for(let h=0,m=d.length;h<m;h++)u.push(d[h].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,u=a.length;c<u;c++){const d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const $l=new ce,ai=new ol,rs=new Or,Kl=new N,Oi=new N,Bi=new N,zi=new N,za=new N,ss=new N,as=new kt,os=new kt,ls=new kt,Zl=new N,jl=new N,Jl=new N,cs=new N,us=new N;class Fe extends Re{constructor(t=new Oe,e=new ni){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const r=e[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(r,t);const o=this.morphTargetInfluences;if(s&&o){ss.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=o[l],d=s[l];u!==0&&(za.fromBufferAttribute(d,t),a?ss.addScaledVector(za,u):ss.addScaledVector(za.sub(e),u))}e.add(ss)}return e}raycast(t,e){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),rs.copy(n.boundingSphere),rs.applyMatrix4(s),ai.copy(t.ray).recast(t.near),!(rs.containsPoint(ai.origin)===!1&&(ai.intersectSphere(rs,Kl)===null||ai.origin.distanceToSquared(Kl)>(t.far-t.near)**2))&&($l.copy(s).invert(),ai.copy(t.ray).applyMatrix4($l),!(n.boundingBox!==null&&ai.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ai)))}_computeIntersections(t,e,n){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,d=s.attributes.normal,h=s.groups,m=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,_=h.length;g<_;g++){const f=h[g],p=a[f.materialIndex],S=Math.max(f.start,m.start),v=Math.min(o.count,Math.min(f.start+f.count,m.start+m.count));for(let E=S,w=v;E<w;E+=3){const b=o.getX(E),A=o.getX(E+1),L=o.getX(E+2);r=hs(this,p,t,n,c,u,d,b,A,L),r&&(r.faceIndex=Math.floor(E/3),r.face.materialIndex=f.materialIndex,e.push(r))}}else{const g=Math.max(0,m.start),_=Math.min(o.count,m.start+m.count);for(let f=g,p=_;f<p;f+=3){const S=o.getX(f),v=o.getX(f+1),E=o.getX(f+2);r=hs(this,a,t,n,c,u,d,S,v,E),r&&(r.faceIndex=Math.floor(f/3),e.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,_=h.length;g<_;g++){const f=h[g],p=a[f.materialIndex],S=Math.max(f.start,m.start),v=Math.min(l.count,Math.min(f.start+f.count,m.start+m.count));for(let E=S,w=v;E<w;E+=3){const b=E,A=E+1,L=E+2;r=hs(this,p,t,n,c,u,d,b,A,L),r&&(r.faceIndex=Math.floor(E/3),r.face.materialIndex=f.materialIndex,e.push(r))}}else{const g=Math.max(0,m.start),_=Math.min(l.count,m.start+m.count);for(let f=g,p=_;f<p;f+=3){const S=f,v=f+1,E=f+2;r=hs(this,a,t,n,c,u,d,S,v,E),r&&(r.faceIndex=Math.floor(f/3),e.push(r))}}}}function qd(i,t,e,n,r,s,a,o){let l;if(t.side===De?l=n.intersectTriangle(a,s,r,!0,o):l=n.intersectTriangle(r,s,a,t.side===Qn,o),l===null)return null;us.copy(o),us.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(us);return c<e.near||c>e.far?null:{distance:c,point:us.clone(),object:i}}function hs(i,t,e,n,r,s,a,o,l,c){i.getVertexPosition(o,Oi),i.getVertexPosition(l,Bi),i.getVertexPosition(c,zi);const u=qd(i,t,e,n,Oi,Bi,zi,cs);if(u){r&&(as.fromBufferAttribute(r,o),os.fromBufferAttribute(r,l),ls.fromBufferAttribute(r,c),u.uv=Ye.getInterpolation(cs,Oi,Bi,zi,as,os,ls,new kt)),s&&(as.fromBufferAttribute(s,o),os.fromBufferAttribute(s,l),ls.fromBufferAttribute(s,c),u.uv1=Ye.getInterpolation(cs,Oi,Bi,zi,as,os,ls,new kt)),a&&(Zl.fromBufferAttribute(a,o),jl.fromBufferAttribute(a,l),Jl.fromBufferAttribute(a,c),u.normal=Ye.getInterpolation(cs,Oi,Bi,zi,Zl,jl,Jl,new N),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a:o,b:l,c,normal:new N,materialIndex:0};Ye.getNormal(Oi,Bi,zi,d.normal),u.face=d}return u}class Ti extends Oe{constructor(t=1,e=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],u=[],d=[];let h=0,m=0;g("z","y","x",-1,-1,n,e,t,a,s,0),g("z","y","x",1,-1,n,e,-t,a,s,1),g("x","z","y",1,1,t,n,e,r,a,2),g("x","z","y",1,-1,t,n,-e,r,a,3),g("x","y","z",1,-1,t,e,n,r,s,4),g("x","y","z",-1,-1,t,e,-n,r,s,5),this.setIndex(l),this.setAttribute("position",new Ve(c,3)),this.setAttribute("normal",new Ve(u,3)),this.setAttribute("uv",new Ve(d,2));function g(_,f,p,S,v,E,w,b,A,L,T){const x=E/A,P=w/L,z=E/2,F=w/2,H=b/2,q=A+1,V=L+1;let Q=0,G=0;const ht=new N;for(let ct=0;ct<V;ct++){const dt=ct*P-F;for(let Ut=0;Ut<q;Ut++){const Ht=Ut*x-z;ht[_]=Ht*S,ht[f]=dt*v,ht[p]=H,c.push(ht.x,ht.y,ht.z),ht[_]=0,ht[f]=0,ht[p]=b>0?1:-1,u.push(ht.x,ht.y,ht.z),d.push(Ut/A),d.push(1-ct/L),Q+=1}}for(let ct=0;ct<L;ct++)for(let dt=0;dt<A;dt++){const Ut=h+dt+q*ct,Ht=h+dt+q*(ct+1),W=h+(dt+1)+q*(ct+1),j=h+(dt+1)+q*ct;l.push(Ut,Ht,j),l.push(Ht,W,j),G+=6}o.addGroup(m,G,T),m+=G,h+=Q}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ti(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function sr(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const r=i[e][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=r.clone():Array.isArray(r)?t[e][n]=r.slice():t[e][n]=r}}return t}function Pe(i){const t={};for(let e=0;e<i.length;e++){const n=sr(i[e]);for(const r in n)t[r]=n[r]}return t}function Yd(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Ou(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:jt.workingColorSpace}const $d={clone:sr,merge:Pe};var Kd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Zd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ti extends Ei{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Kd,this.fragmentShader=Zd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=sr(t.uniforms),this.uniformsGroups=Yd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?e.uniforms[r]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[r]={type:"m4",value:a.toArray()}:e.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Bu extends Re{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ce,this.projectionMatrix=new ce,this.projectionMatrixInverse=new ce,this.coordinateSystem=In}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Wn=new N,Ql=new kt,tc=new kt;class qe extends Bu{constructor(t=50,e=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=zo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Fs*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return zo*2*Math.atan(Math.tan(Fs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Wn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Wn.x,Wn.y).multiplyScalar(-t/Wn.z),Wn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Wn.x,Wn.y).multiplyScalar(-t/Wn.z)}getViewSize(t,e){return this.getViewBounds(t,Ql,tc),e.subVectors(tc,Ql)}setViewOffset(t,e,n,r,s,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Fs*.5*this.fov)/this.zoom,n=2*e,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,e-=a.offsetY*n/c,r*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(s+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const ki=-90,Hi=1;class jd extends Re{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new qe(ki,Hi,t,e);r.layers=this.layers,this.add(r);const s=new qe(ki,Hi,t,e);s.layers=this.layers,this.add(s);const a=new qe(ki,Hi,t,e);a.layers=this.layers,this.add(a);const o=new qe(ki,Hi,t,e);o.layers=this.layers,this.add(o);const l=new qe(ki,Hi,t,e);l.layers=this.layers,this.add(l);const c=new qe(ki,Hi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,r,s,a,o,l]=e;for(const c of e)this.remove(c);if(t===In)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===qs)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,u]=this.children,d=t.getRenderTarget(),h=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,r),t.render(e,s),t.setRenderTarget(n,1,r),t.render(e,a),t.setRenderTarget(n,2,r),t.render(e,o),t.setRenderTarget(n,3,r),t.render(e,l),t.setRenderTarget(n,4,r),t.render(e,c),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,r),t.render(e,u),t.setRenderTarget(d,h,m),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class zu extends Ie{constructor(t,e,n,r,s,a,o,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:er,super(t,e,n,r,s,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Jd extends yi{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},r=[n,n,n,n,n,n];this.texture=new zu(r,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:an}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Ti(5,5,5),s=new ti({name:"CubemapFromEquirect",uniforms:sr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:De,blending:Zn});s.uniforms.tEquirect.value=e;const a=new Fe(r,s),o=e.minFilter;return e.minFilter===vi&&(e.minFilter=an),new jd(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,r){const s=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,r);t.setRenderTarget(s)}}const ka=new N,Qd=new N,tf=new Bt;class di{constructor(t=new N(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,r){return this.normal.set(t,e,n),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const r=ka.subVectors(n,e).cross(Qd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(ka),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:e.copy(t.start).addScaledVector(n,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||tf.getNormalMatrix(t),r=this.coplanarPoint(ka).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const oi=new Or,ds=new N;class ku{constructor(t=new di,e=new di,n=new di,r=new di,s=new di,a=new di){this.planes=[t,e,n,r,s,a]}set(t,e,n,r,s,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=In){const n=this.planes,r=t.elements,s=r[0],a=r[1],o=r[2],l=r[3],c=r[4],u=r[5],d=r[6],h=r[7],m=r[8],g=r[9],_=r[10],f=r[11],p=r[12],S=r[13],v=r[14],E=r[15];if(n[0].setComponents(l-s,h-c,f-m,E-p).normalize(),n[1].setComponents(l+s,h+c,f+m,E+p).normalize(),n[2].setComponents(l+a,h+u,f+g,E+S).normalize(),n[3].setComponents(l-a,h-u,f-g,E-S).normalize(),n[4].setComponents(l-o,h-d,f-_,E-v).normalize(),e===In)n[5].setComponents(l+o,h+d,f+_,E+v).normalize();else if(e===qs)n[5].setComponents(o,d,_,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),oi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),oi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(oi)}intersectsSprite(t){return oi.center.set(0,0,0),oi.radius=.7071067811865476,oi.applyMatrix4(t.matrixWorld),this.intersectsSphere(oi)}intersectsSphere(t){const e=this.planes,n=t.center,r=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const r=e[n];if(ds.x=r.normal.x>0?t.max.x:t.min.x,ds.y=r.normal.y>0?t.max.y:t.min.y,ds.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(ds)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Hu(){let i=null,t=!1,e=null,n=null;function r(s,a){e(s,a),n=i.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(r),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){i=s}}}function ef(i){const t=new WeakMap;function e(o,l){const c=o.array,u=o.usage,d=c.byteLength,h=i.createBuffer();i.bindBuffer(l,h),i.bufferData(l,c,u),o.onUploadCallback();let m;if(c instanceof Float32Array)m=i.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=i.SHORT;else if(c instanceof Uint32Array)m=i.UNSIGNED_INT;else if(c instanceof Int32Array)m=i.INT;else if(c instanceof Int8Array)m=i.BYTE;else if(c instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){const u=l.array,d=l._updateRange,h=l.updateRanges;if(i.bindBuffer(c,o),d.count===-1&&h.length===0&&i.bufferSubData(c,0,u),h.length!==0){for(let m=0,g=h.length;m<g;m++){const _=h[m];i.bufferSubData(c,_.start*u.BYTES_PER_ELEMENT,u,_.start,_.count)}l.clearUpdateRanges()}d.count!==-1&&(i.bufferSubData(c,d.offset*u.BYTES_PER_ELEMENT,u,d.offset,d.count),d.count=-1),l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isGLBufferAttribute){const u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}o.isInterleavedBufferAttribute&&(o=o.data);const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}class Br extends Oe{constructor(t=1,e=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:r};const s=t/2,a=e/2,o=Math.floor(n),l=Math.floor(r),c=o+1,u=l+1,d=t/o,h=e/l,m=[],g=[],_=[],f=[];for(let p=0;p<u;p++){const S=p*h-a;for(let v=0;v<c;v++){const E=v*d-s;g.push(E,-S,0),_.push(0,0,1),f.push(v/o),f.push(1-p/l)}}for(let p=0;p<l;p++)for(let S=0;S<o;S++){const v=S+c*p,E=S+c*(p+1),w=S+1+c*(p+1),b=S+1+c*p;m.push(v,E,b),m.push(E,w,b)}this.setIndex(m),this.setAttribute("position",new Ve(g,3)),this.setAttribute("normal",new Ve(_,3)),this.setAttribute("uv",new Ve(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Br(t.width,t.height,t.widthSegments,t.heightSegments)}}var nf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,rf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,sf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,af=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,of=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,lf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,cf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,uf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,hf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,df=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,ff=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,pf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,mf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,gf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,_f=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,vf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,xf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Mf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Sf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,yf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ef=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Tf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,bf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Af=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,wf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Rf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Cf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Pf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Lf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Df=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,If="gl_FragColor = linearToOutputTexel( gl_FragColor );",Uf=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,Nf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Ff=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Of=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Bf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,zf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,kf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Hf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Gf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Vf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Wf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Xf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,qf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Yf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,$f=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Kf=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Zf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,jf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Jf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Qf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,tp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,ep=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,np=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,ip=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,rp=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,sp=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ap=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,op=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,lp=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,cp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,up=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,hp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,dp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,fp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,pp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,mp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,gp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,_p=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,xp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Mp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Sp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,yp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ep=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Tp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,bp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Ap=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,wp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Rp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Cp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Pp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Lp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Dp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ip=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Up=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Np=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Fp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Op=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Bp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,zp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,kp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Hp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Gp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Vp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Wp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Xp=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,qp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Yp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,$p=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Kp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Zp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,jp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Jp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Qp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,tm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,em=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const nm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,im=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,sm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,am=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,om=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,lm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,cm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,um=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,hm=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,dm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,fm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,mm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,gm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,_m=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Mm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Sm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ym=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Em=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Tm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Am=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,wm=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Rm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Cm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Pm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Lm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Dm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Im=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Um=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Nm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ot={alphahash_fragment:nf,alphahash_pars_fragment:rf,alphamap_fragment:sf,alphamap_pars_fragment:af,alphatest_fragment:of,alphatest_pars_fragment:lf,aomap_fragment:cf,aomap_pars_fragment:uf,batching_pars_vertex:hf,batching_vertex:df,begin_vertex:ff,beginnormal_vertex:pf,bsdfs:mf,iridescence_fragment:gf,bumpmap_pars_fragment:_f,clipping_planes_fragment:vf,clipping_planes_pars_fragment:xf,clipping_planes_pars_vertex:Mf,clipping_planes_vertex:Sf,color_fragment:yf,color_pars_fragment:Ef,color_pars_vertex:Tf,color_vertex:bf,common:Af,cube_uv_reflection_fragment:wf,defaultnormal_vertex:Rf,displacementmap_pars_vertex:Cf,displacementmap_vertex:Pf,emissivemap_fragment:Lf,emissivemap_pars_fragment:Df,colorspace_fragment:If,colorspace_pars_fragment:Uf,envmap_fragment:Nf,envmap_common_pars_fragment:Ff,envmap_pars_fragment:Of,envmap_pars_vertex:Bf,envmap_physical_pars_fragment:Kf,envmap_vertex:zf,fog_vertex:kf,fog_pars_vertex:Hf,fog_fragment:Gf,fog_pars_fragment:Vf,gradientmap_pars_fragment:Wf,lightmap_pars_fragment:Xf,lights_lambert_fragment:qf,lights_lambert_pars_fragment:Yf,lights_pars_begin:$f,lights_toon_fragment:Zf,lights_toon_pars_fragment:jf,lights_phong_fragment:Jf,lights_phong_pars_fragment:Qf,lights_physical_fragment:tp,lights_physical_pars_fragment:ep,lights_fragment_begin:np,lights_fragment_maps:ip,lights_fragment_end:rp,logdepthbuf_fragment:sp,logdepthbuf_pars_fragment:ap,logdepthbuf_pars_vertex:op,logdepthbuf_vertex:lp,map_fragment:cp,map_pars_fragment:up,map_particle_fragment:hp,map_particle_pars_fragment:dp,metalnessmap_fragment:fp,metalnessmap_pars_fragment:pp,morphinstance_vertex:mp,morphcolor_vertex:gp,morphnormal_vertex:_p,morphtarget_pars_vertex:vp,morphtarget_vertex:xp,normal_fragment_begin:Mp,normal_fragment_maps:Sp,normal_pars_fragment:yp,normal_pars_vertex:Ep,normal_vertex:Tp,normalmap_pars_fragment:bp,clearcoat_normal_fragment_begin:Ap,clearcoat_normal_fragment_maps:wp,clearcoat_pars_fragment:Rp,iridescence_pars_fragment:Cp,opaque_fragment:Pp,packing:Lp,premultiplied_alpha_fragment:Dp,project_vertex:Ip,dithering_fragment:Up,dithering_pars_fragment:Np,roughnessmap_fragment:Fp,roughnessmap_pars_fragment:Op,shadowmap_pars_fragment:Bp,shadowmap_pars_vertex:zp,shadowmap_vertex:kp,shadowmask_pars_fragment:Hp,skinbase_vertex:Gp,skinning_pars_vertex:Vp,skinning_vertex:Wp,skinnormal_vertex:Xp,specularmap_fragment:qp,specularmap_pars_fragment:Yp,tonemapping_fragment:$p,tonemapping_pars_fragment:Kp,transmission_fragment:Zp,transmission_pars_fragment:jp,uv_pars_fragment:Jp,uv_pars_vertex:Qp,uv_vertex:tm,worldpos_vertex:em,background_vert:nm,background_frag:im,backgroundCube_vert:rm,backgroundCube_frag:sm,cube_vert:am,cube_frag:om,depth_vert:lm,depth_frag:cm,distanceRGBA_vert:um,distanceRGBA_frag:hm,equirect_vert:dm,equirect_frag:fm,linedashed_vert:pm,linedashed_frag:mm,meshbasic_vert:gm,meshbasic_frag:_m,meshlambert_vert:vm,meshlambert_frag:xm,meshmatcap_vert:Mm,meshmatcap_frag:Sm,meshnormal_vert:ym,meshnormal_frag:Em,meshphong_vert:Tm,meshphong_frag:bm,meshphysical_vert:Am,meshphysical_frag:wm,meshtoon_vert:Rm,meshtoon_frag:Cm,points_vert:Pm,points_frag:Lm,shadow_vert:Dm,shadow_frag:Im,sprite_vert:Um,sprite_frag:Nm},lt={common:{diffuse:{value:new Gt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Bt},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Bt}},envmap:{envMap:{value:null},envMapRotation:{value:new Bt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Bt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Bt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Bt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Bt},normalScale:{value:new kt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Bt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Bt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Bt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Bt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Gt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Gt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0},uvTransform:{value:new Bt}},sprite:{diffuse:{value:new Gt(16777215)},opacity:{value:1},center:{value:new kt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Bt},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0}}},gn={basic:{uniforms:Pe([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.fog]),vertexShader:Ot.meshbasic_vert,fragmentShader:Ot.meshbasic_frag},lambert:{uniforms:Pe([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Gt(0)}}]),vertexShader:Ot.meshlambert_vert,fragmentShader:Ot.meshlambert_frag},phong:{uniforms:Pe([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Gt(0)},specular:{value:new Gt(1118481)},shininess:{value:30}}]),vertexShader:Ot.meshphong_vert,fragmentShader:Ot.meshphong_frag},standard:{uniforms:Pe([lt.common,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.roughnessmap,lt.metalnessmap,lt.fog,lt.lights,{emissive:{value:new Gt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag},toon:{uniforms:Pe([lt.common,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.gradientmap,lt.fog,lt.lights,{emissive:{value:new Gt(0)}}]),vertexShader:Ot.meshtoon_vert,fragmentShader:Ot.meshtoon_frag},matcap:{uniforms:Pe([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,{matcap:{value:null}}]),vertexShader:Ot.meshmatcap_vert,fragmentShader:Ot.meshmatcap_frag},points:{uniforms:Pe([lt.points,lt.fog]),vertexShader:Ot.points_vert,fragmentShader:Ot.points_frag},dashed:{uniforms:Pe([lt.common,lt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ot.linedashed_vert,fragmentShader:Ot.linedashed_frag},depth:{uniforms:Pe([lt.common,lt.displacementmap]),vertexShader:Ot.depth_vert,fragmentShader:Ot.depth_frag},normal:{uniforms:Pe([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,{opacity:{value:1}}]),vertexShader:Ot.meshnormal_vert,fragmentShader:Ot.meshnormal_frag},sprite:{uniforms:Pe([lt.sprite,lt.fog]),vertexShader:Ot.sprite_vert,fragmentShader:Ot.sprite_frag},background:{uniforms:{uvTransform:{value:new Bt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ot.background_vert,fragmentShader:Ot.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Bt}},vertexShader:Ot.backgroundCube_vert,fragmentShader:Ot.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ot.cube_vert,fragmentShader:Ot.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ot.equirect_vert,fragmentShader:Ot.equirect_frag},distanceRGBA:{uniforms:Pe([lt.common,lt.displacementmap,{referencePosition:{value:new N},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ot.distanceRGBA_vert,fragmentShader:Ot.distanceRGBA_frag},shadow:{uniforms:Pe([lt.lights,lt.fog,{color:{value:new Gt(0)},opacity:{value:1}}]),vertexShader:Ot.shadow_vert,fragmentShader:Ot.shadow_frag}};gn.physical={uniforms:Pe([gn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Bt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Bt},clearcoatNormalScale:{value:new kt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Bt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Bt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Bt},sheen:{value:0},sheenColor:{value:new Gt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Bt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Bt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Bt},transmissionSamplerSize:{value:new kt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Bt},attenuationDistance:{value:0},attenuationColor:{value:new Gt(0)},specularColor:{value:new Gt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Bt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Bt},anisotropyVector:{value:new kt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Bt}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag};const fs={r:0,b:0,g:0},li=new Fn,Fm=new ce;function Om(i,t,e,n,r,s,a){const o=new Gt(0);let l=s===!0?0:1,c,u,d=null,h=0,m=null;function g(S){let v=S.isScene===!0?S.background:null;return v&&v.isTexture&&(v=(S.backgroundBlurriness>0?e:t).get(v)),v}function _(S){let v=!1;const E=g(S);E===null?p(o,l):E&&E.isColor&&(p(E,1),v=!0);const w=i.xr.getEnvironmentBlendMode();w==="additive"?n.buffers.color.setClear(0,0,0,1,a):w==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||v)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function f(S,v){const E=g(v);E&&(E.isCubeTexture||E.mapping===aa)?(u===void 0&&(u=new Fe(new Ti(1,1,1),new ti({name:"BackgroundCubeMaterial",uniforms:sr(gn.backgroundCube.uniforms),vertexShader:gn.backgroundCube.vertexShader,fragmentShader:gn.backgroundCube.fragmentShader,side:De,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(w,b,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),li.copy(v.backgroundRotation),li.x*=-1,li.y*=-1,li.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(li.y*=-1,li.z*=-1),u.material.uniforms.envMap.value=E,u.material.uniforms.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Fm.makeRotationFromEuler(li)),u.material.toneMapped=jt.getTransfer(E.colorSpace)!==ee,(d!==E||h!==E.version||m!==i.toneMapping)&&(u.material.needsUpdate=!0,d=E,h=E.version,m=i.toneMapping),u.layers.enableAll(),S.unshift(u,u.geometry,u.material,0,0,null)):E&&E.isTexture&&(c===void 0&&(c=new Fe(new Br(2,2),new ti({name:"BackgroundMaterial",uniforms:sr(gn.background.uniforms),vertexShader:gn.background.vertexShader,fragmentShader:gn.background.fragmentShader,side:Qn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=E,c.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,c.material.toneMapped=jt.getTransfer(E.colorSpace)!==ee,E.matrixAutoUpdate===!0&&E.updateMatrix(),c.material.uniforms.uvTransform.value.copy(E.matrix),(d!==E||h!==E.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,d=E,h=E.version,m=i.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null))}function p(S,v){S.getRGB(fs,Ou(i)),n.buffers.color.setClear(fs.r,fs.g,fs.b,v,a)}return{getClearColor:function(){return o},setClearColor:function(S,v=1){o.set(S),l=v,p(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(S){l=S,p(o,l)},render:_,addToRenderList:f}}function Bm(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=h(null);let s=r,a=!1;function o(x,P,z,F,H){let q=!1;const V=d(F,z,P);s!==V&&(s=V,c(s.object)),q=m(x,F,z,H),q&&g(x,F,z,H),H!==null&&t.update(H,i.ELEMENT_ARRAY_BUFFER),(q||a)&&(a=!1,E(x,P,z,F),H!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(H).buffer))}function l(){return i.createVertexArray()}function c(x){return i.bindVertexArray(x)}function u(x){return i.deleteVertexArray(x)}function d(x,P,z){const F=z.wireframe===!0;let H=n[x.id];H===void 0&&(H={},n[x.id]=H);let q=H[P.id];q===void 0&&(q={},H[P.id]=q);let V=q[F];return V===void 0&&(V=h(l()),q[F]=V),V}function h(x){const P=[],z=[],F=[];for(let H=0;H<e;H++)P[H]=0,z[H]=0,F[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:z,attributeDivisors:F,object:x,attributes:{},index:null}}function m(x,P,z,F){const H=s.attributes,q=P.attributes;let V=0;const Q=z.getAttributes();for(const G in Q)if(Q[G].location>=0){const ct=H[G];let dt=q[G];if(dt===void 0&&(G==="instanceMatrix"&&x.instanceMatrix&&(dt=x.instanceMatrix),G==="instanceColor"&&x.instanceColor&&(dt=x.instanceColor)),ct===void 0||ct.attribute!==dt||dt&&ct.data!==dt.data)return!0;V++}return s.attributesNum!==V||s.index!==F}function g(x,P,z,F){const H={},q=P.attributes;let V=0;const Q=z.getAttributes();for(const G in Q)if(Q[G].location>=0){let ct=q[G];ct===void 0&&(G==="instanceMatrix"&&x.instanceMatrix&&(ct=x.instanceMatrix),G==="instanceColor"&&x.instanceColor&&(ct=x.instanceColor));const dt={};dt.attribute=ct,ct&&ct.data&&(dt.data=ct.data),H[G]=dt,V++}s.attributes=H,s.attributesNum=V,s.index=F}function _(){const x=s.newAttributes;for(let P=0,z=x.length;P<z;P++)x[P]=0}function f(x){p(x,0)}function p(x,P){const z=s.newAttributes,F=s.enabledAttributes,H=s.attributeDivisors;z[x]=1,F[x]===0&&(i.enableVertexAttribArray(x),F[x]=1),H[x]!==P&&(i.vertexAttribDivisor(x,P),H[x]=P)}function S(){const x=s.newAttributes,P=s.enabledAttributes;for(let z=0,F=P.length;z<F;z++)P[z]!==x[z]&&(i.disableVertexAttribArray(z),P[z]=0)}function v(x,P,z,F,H,q,V){V===!0?i.vertexAttribIPointer(x,P,z,H,q):i.vertexAttribPointer(x,P,z,F,H,q)}function E(x,P,z,F){_();const H=F.attributes,q=z.getAttributes(),V=P.defaultAttributeValues;for(const Q in q){const G=q[Q];if(G.location>=0){let ht=H[Q];if(ht===void 0&&(Q==="instanceMatrix"&&x.instanceMatrix&&(ht=x.instanceMatrix),Q==="instanceColor"&&x.instanceColor&&(ht=x.instanceColor)),ht!==void 0){const ct=ht.normalized,dt=ht.itemSize,Ut=t.get(ht);if(Ut===void 0)continue;const Ht=Ut.buffer,W=Ut.type,j=Ut.bytesPerElement,ot=W===i.INT||W===i.UNSIGNED_INT||ht.gpuType===Qo;if(ht.isInterleavedBufferAttribute){const at=ht.data,yt=at.stride,At=ht.offset;if(at.isInstancedInterleavedBuffer){for(let Mt=0;Mt<G.locationSize;Mt++)p(G.location+Mt,at.meshPerAttribute);x.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=at.meshPerAttribute*at.count)}else for(let Mt=0;Mt<G.locationSize;Mt++)f(G.location+Mt);i.bindBuffer(i.ARRAY_BUFFER,Ht);for(let Mt=0;Mt<G.locationSize;Mt++)v(G.location+Mt,dt/G.locationSize,W,ct,yt*j,(At+dt/G.locationSize*Mt)*j,ot)}else{if(ht.isInstancedBufferAttribute){for(let at=0;at<G.locationSize;at++)p(G.location+at,ht.meshPerAttribute);x.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=ht.meshPerAttribute*ht.count)}else for(let at=0;at<G.locationSize;at++)f(G.location+at);i.bindBuffer(i.ARRAY_BUFFER,Ht);for(let at=0;at<G.locationSize;at++)v(G.location+at,dt/G.locationSize,W,ct,dt*j,dt/G.locationSize*at*j,ot)}}else if(V!==void 0){const ct=V[Q];if(ct!==void 0)switch(ct.length){case 2:i.vertexAttrib2fv(G.location,ct);break;case 3:i.vertexAttrib3fv(G.location,ct);break;case 4:i.vertexAttrib4fv(G.location,ct);break;default:i.vertexAttrib1fv(G.location,ct)}}}}S()}function w(){L();for(const x in n){const P=n[x];for(const z in P){const F=P[z];for(const H in F)u(F[H].object),delete F[H];delete P[z]}delete n[x]}}function b(x){if(n[x.id]===void 0)return;const P=n[x.id];for(const z in P){const F=P[z];for(const H in F)u(F[H].object),delete F[H];delete P[z]}delete n[x.id]}function A(x){for(const P in n){const z=n[P];if(z[x.id]===void 0)continue;const F=z[x.id];for(const H in F)u(F[H].object),delete F[H];delete z[x.id]}}function L(){T(),a=!0,s!==r&&(s=r,c(s.object))}function T(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:L,resetDefaultState:T,dispose:w,releaseStatesOfGeometry:b,releaseStatesOfProgram:A,initAttributes:_,enableAttribute:f,disableUnusedAttributes:S}}function zm(i,t,e){let n;function r(c){n=c}function s(c,u){i.drawArrays(n,c,u),e.update(u,n,1)}function a(c,u,d){d!==0&&(i.drawArraysInstanced(n,c,u,d),e.update(u,n,d))}function o(c,u,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,d);let m=0;for(let g=0;g<d;g++)m+=u[g];e.update(m,n,1)}function l(c,u,d,h){if(d===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<c.length;g++)a(c[g],u[g],h[g]);else{m.multiDrawArraysInstancedWEBGL(n,c,0,u,0,h,0,d);let g=0;for(let _=0;_<d;_++)g+=u[_];for(let _=0;_<h.length;_++)e.update(g,n,h[_])}}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function km(i,t,e,n){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){const b=t.get("EXT_texture_filter_anisotropic");r=i.getParameter(b.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(b){return!(b!==on&&n.convert(b)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(b){const A=b===Ur&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(b!==Nn&&n.convert(b)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&b!==Dn&&!A)}function l(b){if(b==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";b="mediump"}return b==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const d=e.logarithmicDepthBuffer===!0,h=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_TEXTURE_SIZE),_=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),p=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),S=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),E=m>0,w=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,maxTextures:h,maxVertexTextures:m,maxTextureSize:g,maxCubemapSize:_,maxAttributes:f,maxVertexUniforms:p,maxVaryings:S,maxFragmentUniforms:v,vertexTextures:E,maxSamples:w}}function Hm(i){const t=this;let e=null,n=0,r=!1,s=!1;const a=new di,o=new Bt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){const m=d.length!==0||h||n!==0||r;return r=h,n=d.length,m},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,h){e=u(d,h,0)},this.setState=function(d,h,m){const g=d.clippingPlanes,_=d.clipIntersection,f=d.clipShadows,p=i.get(d);if(!r||g===null||g.length===0||s&&!f)s?u(null):c();else{const S=s?0:n,v=S*4;let E=p.clippingState||null;l.value=E,E=u(g,h,v,m);for(let w=0;w!==v;++w)E[w]=e[w];p.clippingState=E,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=S}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(d,h,m,g){const _=d!==null?d.length:0;let f=null;if(_!==0){if(f=l.value,g!==!0||f===null){const p=m+_*4,S=h.matrixWorldInverse;o.getNormalMatrix(S),(f===null||f.length<p)&&(f=new Float32Array(p));for(let v=0,E=m;v!==_;++v,E+=4)a.copy(d[v]).applyMatrix4(S,o),a.normal.toArray(f,E),f[E+3]=a.constant}l.value=f,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,f}}function Gm(i){let t=new WeakMap;function e(a,o){return o===lo?a.mapping=er:o===co&&(a.mapping=nr),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===lo||o===co)if(t.has(a)){const l=t.get(a).texture;return e(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new Jd(l.height);return c.fromEquirectangularTexture(i,a),t.set(a,c),a.addEventListener("dispose",r),e(c.texture,a.mapping)}else return null}}return a}function r(a){const o=a.target;o.removeEventListener("dispose",r);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function s(){t=new WeakMap}return{get:n,dispose:s}}class Vm extends Bu{constructor(t=-1,e=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-t,a=n+t,o=r+e,l=r-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const $i=4,ec=[.125,.215,.35,.446,.526,.582],gi=20,Ha=new Vm,nc=new Gt;let Ga=null,Va=0,Wa=0,Xa=!1;const fi=(1+Math.sqrt(5))/2,Gi=1/fi,ic=[new N(-fi,Gi,0),new N(fi,Gi,0),new N(-Gi,0,fi),new N(Gi,0,fi),new N(0,fi,-Gi),new N(0,fi,Gi),new N(-1,1,-1),new N(1,1,-1),new N(-1,1,1),new N(1,1,1)];class rc{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,r=100){Ga=this._renderer.getRenderTarget(),Va=this._renderer.getActiveCubeFace(),Wa=this._renderer.getActiveMipmapLevel(),Xa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,n,r,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=oc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ac(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Ga,Va,Wa),this._renderer.xr.enabled=Xa,t.scissorTest=!1,ps(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===er||t.mapping===nr?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Ga=this._renderer.getRenderTarget(),Va=this._renderer.getActiveCubeFace(),Wa=this._renderer.getActiveMipmapLevel(),Xa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:an,minFilter:an,generateMipmaps:!1,type:Ur,format:on,colorSpace:ei,depthBuffer:!1},r=sc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=sc(t,e,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Wm(s)),this._blurMaterial=Xm(s,t,e)}return r}_compileMaterial(t){const e=new Fe(this._lodPlanes[0],t);this._renderer.compile(e,Ha)}_sceneToCubeUV(t,e,n,r){const o=new qe(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,h=u.toneMapping;u.getClearColor(nc),u.toneMapping=jn,u.autoClear=!1;const m=new ni({name:"PMREM.Background",side:De,depthWrite:!1,depthTest:!1}),g=new Fe(new Ti,m);let _=!1;const f=t.background;f?f.isColor&&(m.color.copy(f),t.background=null,_=!0):(m.color.copy(nc),_=!0);for(let p=0;p<6;p++){const S=p%3;S===0?(o.up.set(0,l[p],0),o.lookAt(c[p],0,0)):S===1?(o.up.set(0,0,l[p]),o.lookAt(0,c[p],0)):(o.up.set(0,l[p],0),o.lookAt(0,0,c[p]));const v=this._cubeSize;ps(r,S*v,p>2?v:0,v,v),u.setRenderTarget(r),_&&u.render(g,o),u.render(t,o)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=h,u.autoClear=d,t.background=f}_textureToCubeUV(t,e){const n=this._renderer,r=t.mapping===er||t.mapping===nr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=oc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ac());const s=r?this._cubemapMaterial:this._equirectMaterial,a=new Fe(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=t;const l=this._cubeSize;ps(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,Ha)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const r=this._lodPlanes.length;for(let s=1;s<r;s++){const a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=ic[(r-s-1)%ic.length];this._blur(t,s-1,s,a,o)}e.autoClear=n}_blur(t,e,n,r,s){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,r,"latitudinal",s),this._halfBlur(a,t,n,n,r,"longitudinal",s)}_halfBlur(t,e,n,r,s,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,d=new Fe(this._lodPlanes[r],c),h=c.uniforms,m=this._sizeLods[n]-1,g=isFinite(s)?Math.PI/(2*m):2*Math.PI/(2*gi-1),_=s/g,f=isFinite(s)?1+Math.floor(u*_):gi;f>gi&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${gi}`);const p=[];let S=0;for(let A=0;A<gi;++A){const L=A/_,T=Math.exp(-L*L/2);p.push(T),A===0?S+=T:A<f&&(S+=2*T)}for(let A=0;A<p.length;A++)p[A]=p[A]/S;h.envMap.value=t.texture,h.samples.value=f,h.weights.value=p,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);const{_lodMax:v}=this;h.dTheta.value=g,h.mipInt.value=v-n;const E=this._sizeLods[r],w=3*E*(r>v-$i?r-v+$i:0),b=4*(this._cubeSize-E);ps(e,w,b,3*E,2*E),l.setRenderTarget(e),l.render(d,Ha)}}function Wm(i){const t=[],e=[],n=[];let r=i;const s=i-$i+1+ec.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);e.push(o);let l=1/o;a>i-$i?l=ec[a-i+$i-1]:a===0&&(l=0),n.push(l);const c=1/(o-2),u=-c,d=1+c,h=[u,u,d,u,d,d,u,u,d,d,u,d],m=6,g=6,_=3,f=2,p=1,S=new Float32Array(_*g*m),v=new Float32Array(f*g*m),E=new Float32Array(p*g*m);for(let b=0;b<m;b++){const A=b%3*2/3-1,L=b>2?0:-1,T=[A,L,0,A+2/3,L,0,A+2/3,L+1,0,A,L,0,A+2/3,L+1,0,A,L+1,0];S.set(T,_*g*b),v.set(h,f*g*b);const x=[b,b,b,b,b,b];E.set(x,p*g*b)}const w=new Oe;w.setAttribute("position",new Me(S,_)),w.setAttribute("uv",new Me(v,f)),w.setAttribute("faceIndex",new Me(E,p)),t.push(w),r>$i&&r--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function sc(i,t,e){const n=new yi(i,t,e);return n.texture.mapping=aa,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ps(i,t,e,n,r){i.viewport.set(t,e,n,r),i.scissor.set(t,e,n,r)}function Xm(i,t,e){const n=new Float32Array(gi),r=new N(0,1,0);return new ti({name:"SphericalGaussianBlur",defines:{n:gi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:ll(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Zn,depthTest:!1,depthWrite:!1})}function ac(){return new ti({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ll(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Zn,depthTest:!1,depthWrite:!1})}function oc(){return new ti({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ll(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Zn,depthTest:!1,depthWrite:!1})}function ll(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function qm(i){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===lo||l===co,u=l===er||l===nr;if(c||u){let d=t.get(o);const h=d!==void 0?d.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==h)return e===null&&(e=new rc(i)),d=c?e.fromEquirectangular(o,d):e.fromCubemap(o,d),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),d.texture;if(d!==void 0)return d.texture;{const m=o.image;return c&&m&&m.height>0||u&&m&&r(m)?(e===null&&(e=new rc(i)),d=c?e.fromEquirectangular(o):e.fromCubemap(o),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),o.addEventListener("dispose",s),d.texture):null}}}return o}function r(o){let l=0;const c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function s(o){const l=o.target;l.removeEventListener("dispose",s);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function Ym(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let r;switch(n){case"WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n)}return t[n]=r,r}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const r=e(n);return r===null&&al("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function $m(i,t,e,n){const r={},s=new WeakMap;function a(d){const h=d.target;h.index!==null&&t.remove(h.index);for(const g in h.attributes)t.remove(h.attributes[g]);for(const g in h.morphAttributes){const _=h.morphAttributes[g];for(let f=0,p=_.length;f<p;f++)t.remove(_[f])}h.removeEventListener("dispose",a),delete r[h.id];const m=s.get(h);m&&(t.remove(m),s.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function o(d,h){return r[h.id]===!0||(h.addEventListener("dispose",a),r[h.id]=!0,e.memory.geometries++),h}function l(d){const h=d.attributes;for(const g in h)t.update(h[g],i.ARRAY_BUFFER);const m=d.morphAttributes;for(const g in m){const _=m[g];for(let f=0,p=_.length;f<p;f++)t.update(_[f],i.ARRAY_BUFFER)}}function c(d){const h=[],m=d.index,g=d.attributes.position;let _=0;if(m!==null){const S=m.array;_=m.version;for(let v=0,E=S.length;v<E;v+=3){const w=S[v+0],b=S[v+1],A=S[v+2];h.push(w,b,b,A,A,w)}}else if(g!==void 0){const S=g.array;_=g.version;for(let v=0,E=S.length/3-1;v<E;v+=3){const w=v+0,b=v+1,A=v+2;h.push(w,b,b,A,A,w)}}else return;const f=new(Pu(h)?Fu:Nu)(h,1);f.version=_;const p=s.get(d);p&&t.remove(p),s.set(d,f)}function u(d){const h=s.get(d);if(h){const m=d.index;m!==null&&h.version<m.version&&c(d)}else c(d);return s.get(d)}return{get:o,update:l,getWireframeAttribute:u}}function Km(i,t,e){let n;function r(h){n=h}let s,a;function o(h){s=h.type,a=h.bytesPerElement}function l(h,m){i.drawElements(n,m,s,h*a),e.update(m,n,1)}function c(h,m,g){g!==0&&(i.drawElementsInstanced(n,m,s,h*a,g),e.update(m,n,g))}function u(h,m,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,s,h,0,g);let f=0;for(let p=0;p<g;p++)f+=m[p];e.update(f,n,1)}function d(h,m,g,_){if(g===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let p=0;p<h.length;p++)c(h[p]/a,m[p],_[p]);else{f.multiDrawElementsInstancedWEBGL(n,m,0,s,h,0,_,0,g);let p=0;for(let S=0;S<g;S++)p+=m[S];for(let S=0;S<_.length;S++)e.update(p,n,_[S])}}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=d}function Zm(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(s/3);break;case i.LINES:e.lines+=o*(s/2);break;case i.LINE_STRIP:e.lines+=o*(s-1);break;case i.LINE_LOOP:e.lines+=o*s;break;case i.POINTS:e.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:n}}function jm(i,t,e){const n=new WeakMap,r=new xe;function s(a,o,l){const c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=u!==void 0?u.length:0;let h=n.get(o);if(h===void 0||h.count!==d){let T=function(){A.dispose(),n.delete(o),o.removeEventListener("dispose",T)};h!==void 0&&h.texture.dispose();const m=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,f=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],S=o.morphAttributes.color||[];let v=0;m===!0&&(v=1),g===!0&&(v=2),_===!0&&(v=3);let E=o.attributes.position.count*v,w=1;E>t.maxTextureSize&&(w=Math.ceil(E/t.maxTextureSize),E=t.maxTextureSize);const b=new Float32Array(E*w*4*d),A=new Du(b,E,w,d);A.type=Dn,A.needsUpdate=!0;const L=v*4;for(let x=0;x<d;x++){const P=f[x],z=p[x],F=S[x],H=E*w*4*x;for(let q=0;q<P.count;q++){const V=q*L;m===!0&&(r.fromBufferAttribute(P,q),b[H+V+0]=r.x,b[H+V+1]=r.y,b[H+V+2]=r.z,b[H+V+3]=0),g===!0&&(r.fromBufferAttribute(z,q),b[H+V+4]=r.x,b[H+V+5]=r.y,b[H+V+6]=r.z,b[H+V+7]=0),_===!0&&(r.fromBufferAttribute(F,q),b[H+V+8]=r.x,b[H+V+9]=r.y,b[H+V+10]=r.z,b[H+V+11]=F.itemSize===4?r.w:1)}}h={count:d,texture:A,size:new kt(E,w)},n.set(o,h),o.addEventListener("dispose",T)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let m=0;for(let _=0;_<c.length;_++)m+=c[_];const g=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",h.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:s}}function Jm(i,t,e,n){let r=new WeakMap;function s(l){const c=n.render.frame,u=l.geometry,d=t.get(l,u);if(r.get(d)!==c&&(t.update(d),r.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),r.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const h=l.skeleton;r.get(h)!==c&&(h.update(),r.set(h,c))}return d}function a(){r=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:s,dispose:a}}class Gu extends Ie{constructor(t,e,n,r,s,a,o,l,c,u=ji){if(u!==ji&&u!==rr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===ji&&(n=Si),n===void 0&&u===rr&&(n=ir),super(null,r,s,a,o,l,u,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Te,this.minFilter=l!==void 0?l:Te,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Vu=new Ie,lc=new Gu(1,1),Wu=new Du,Xu=new Fd,qu=new zu,cc=[],uc=[],hc=new Float32Array(16),dc=new Float32Array(9),fc=new Float32Array(4);function lr(i,t,e){const n=i[0];if(n<=0||n>0)return i;const r=t*e;let s=cc[r];if(s===void 0&&(s=new Float32Array(r),cc[r]=s),t!==0){n.toArray(s,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(s,o)}return s}function ge(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function _e(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function la(i,t){let e=uc[t];e===void 0&&(e=new Int32Array(t),uc[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Qm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function tg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ge(e,t))return;i.uniform2fv(this.addr,t),_e(e,t)}}function eg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ge(e,t))return;i.uniform3fv(this.addr,t),_e(e,t)}}function ng(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ge(e,t))return;i.uniform4fv(this.addr,t),_e(e,t)}}function ig(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(ge(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),_e(e,t)}else{if(ge(e,n))return;fc.set(n),i.uniformMatrix2fv(this.addr,!1,fc),_e(e,n)}}function rg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(ge(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),_e(e,t)}else{if(ge(e,n))return;dc.set(n),i.uniformMatrix3fv(this.addr,!1,dc),_e(e,n)}}function sg(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(ge(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),_e(e,t)}else{if(ge(e,n))return;hc.set(n),i.uniformMatrix4fv(this.addr,!1,hc),_e(e,n)}}function ag(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function og(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ge(e,t))return;i.uniform2iv(this.addr,t),_e(e,t)}}function lg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ge(e,t))return;i.uniform3iv(this.addr,t),_e(e,t)}}function cg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ge(e,t))return;i.uniform4iv(this.addr,t),_e(e,t)}}function ug(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function hg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ge(e,t))return;i.uniform2uiv(this.addr,t),_e(e,t)}}function dg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ge(e,t))return;i.uniform3uiv(this.addr,t),_e(e,t)}}function fg(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ge(e,t))return;i.uniform4uiv(this.addr,t),_e(e,t)}}function pg(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(lc.compareFunction=Cu,s=lc):s=Vu,e.setTexture2D(t||s,r)}function mg(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture3D(t||Xu,r)}function gg(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTextureCube(t||qu,r)}function _g(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture2DArray(t||Wu,r)}function vg(i){switch(i){case 5126:return Qm;case 35664:return tg;case 35665:return eg;case 35666:return ng;case 35674:return ig;case 35675:return rg;case 35676:return sg;case 5124:case 35670:return ag;case 35667:case 35671:return og;case 35668:case 35672:return lg;case 35669:case 35673:return cg;case 5125:return ug;case 36294:return hg;case 36295:return dg;case 36296:return fg;case 35678:case 36198:case 36298:case 36306:case 35682:return pg;case 35679:case 36299:case 36307:return mg;case 35680:case 36300:case 36308:case 36293:return gg;case 36289:case 36303:case 36311:case 36292:return _g}}function xg(i,t){i.uniform1fv(this.addr,t)}function Mg(i,t){const e=lr(t,this.size,2);i.uniform2fv(this.addr,e)}function Sg(i,t){const e=lr(t,this.size,3);i.uniform3fv(this.addr,e)}function yg(i,t){const e=lr(t,this.size,4);i.uniform4fv(this.addr,e)}function Eg(i,t){const e=lr(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Tg(i,t){const e=lr(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function bg(i,t){const e=lr(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Ag(i,t){i.uniform1iv(this.addr,t)}function wg(i,t){i.uniform2iv(this.addr,t)}function Rg(i,t){i.uniform3iv(this.addr,t)}function Cg(i,t){i.uniform4iv(this.addr,t)}function Pg(i,t){i.uniform1uiv(this.addr,t)}function Lg(i,t){i.uniform2uiv(this.addr,t)}function Dg(i,t){i.uniform3uiv(this.addr,t)}function Ig(i,t){i.uniform4uiv(this.addr,t)}function Ug(i,t,e){const n=this.cache,r=t.length,s=la(e,r);ge(n,s)||(i.uniform1iv(this.addr,s),_e(n,s));for(let a=0;a!==r;++a)e.setTexture2D(t[a]||Vu,s[a])}function Ng(i,t,e){const n=this.cache,r=t.length,s=la(e,r);ge(n,s)||(i.uniform1iv(this.addr,s),_e(n,s));for(let a=0;a!==r;++a)e.setTexture3D(t[a]||Xu,s[a])}function Fg(i,t,e){const n=this.cache,r=t.length,s=la(e,r);ge(n,s)||(i.uniform1iv(this.addr,s),_e(n,s));for(let a=0;a!==r;++a)e.setTextureCube(t[a]||qu,s[a])}function Og(i,t,e){const n=this.cache,r=t.length,s=la(e,r);ge(n,s)||(i.uniform1iv(this.addr,s),_e(n,s));for(let a=0;a!==r;++a)e.setTexture2DArray(t[a]||Wu,s[a])}function Bg(i){switch(i){case 5126:return xg;case 35664:return Mg;case 35665:return Sg;case 35666:return yg;case 35674:return Eg;case 35675:return Tg;case 35676:return bg;case 5124:case 35670:return Ag;case 35667:case 35671:return wg;case 35668:case 35672:return Rg;case 35669:case 35673:return Cg;case 5125:return Pg;case 36294:return Lg;case 36295:return Dg;case 36296:return Ig;case 35678:case 36198:case 36298:case 36306:case 35682:return Ug;case 35679:case 36299:case 36307:return Ng;case 35680:case 36300:case 36308:case 36293:return Fg;case 36289:case 36303:case 36311:case 36292:return Og}}class zg{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=vg(e.type)}}class kg{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Bg(e.type)}}class Hg{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(t,e[o.id],n)}}}const qa=/(\w+)(\])?(\[|\.)?/g;function pc(i,t){i.seq.push(t),i.map[t.id]=t}function Gg(i,t,e){const n=i.name,r=n.length;for(qa.lastIndex=0;;){const s=qa.exec(n),a=qa.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){pc(e,c===void 0?new zg(o,i,t):new kg(o,i,t));break}else{let d=e.map[o];d===void 0&&(d=new Hg(o),pc(e,d)),e=d}}}class Os{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){const s=t.getActiveUniform(e,r),a=t.getUniformLocation(e,s.name);Gg(s,a,this)}}setValue(t,e,n,r){const s=this.map[e];s!==void 0&&s.setValue(t,n,r)}setOptional(t,e,n){const r=e[n];r!==void 0&&this.setValue(t,n,r)}static upload(t,e,n,r){for(let s=0,a=e.length;s!==a;++s){const o=e[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,r)}}static seqWithValue(t,e){const n=[];for(let r=0,s=t.length;r!==s;++r){const a=t[r];a.id in e&&n.push(a)}return n}}function mc(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Vg=37297;let Wg=0;function Xg(i,t){const e=i.split(`
`),n=[],r=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}function qg(i){const t=jt.getPrimaries(jt.workingColorSpace),e=jt.getPrimaries(i);let n;switch(t===e?n="":t===Xs&&e===Ws?n="LinearDisplayP3ToLinearSRGB":t===Ws&&e===Xs&&(n="LinearSRGBToLinearDisplayP3"),i){case ei:case oa:return[n,"LinearTransferOETF"];case mn:case sl:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function gc(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),r=i.getShaderInfoLog(t).trim();if(n&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const a=parseInt(s[1]);return e.toUpperCase()+`

`+r+`

`+Xg(i.getShaderSource(t),a)}else return r}function Yg(i,t){const e=qg(t);return`vec4 ${i}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function $g(i,t){let e;switch(t){case cd:e="Linear";break;case ud:e="Reinhard";break;case hd:e="OptimizedCineon";break;case dd:e="ACESFilmic";break;case pd:e="AgX";break;case md:e="Neutral";break;case fd:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function Kg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(yr).join(`
`)}function Zg(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function jg(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(t,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),e[a]={type:s.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function yr(i){return i!==""}function _c(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function vc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Jg=/^[ \t]*#include +<([\w\d./]+)>/gm;function ko(i){return i.replace(Jg,t_)}const Qg=new Map;function t_(i,t){let e=Ot[t];if(e===void 0){const n=Qg.get(t);if(n!==void 0)e=Ot[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return ko(e)}const e_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function xc(i){return i.replace(e_,n_)}function n_(i,t,e,n){let r="";for(let s=parseInt(t);s<parseInt(e);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Mc(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function i_(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===gu?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Nh?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Pn&&(t="SHADOWMAP_TYPE_VSM"),t}function r_(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case er:case nr:t="ENVMAP_TYPE_CUBE";break;case aa:t="ENVMAP_TYPE_CUBE_UV";break}return t}function s_(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case nr:t="ENVMAP_MODE_REFRACTION";break}return t}function a_(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case _u:t="ENVMAP_BLENDING_MULTIPLY";break;case od:t="ENVMAP_BLENDING_MIX";break;case ld:t="ENVMAP_BLENDING_ADD";break}return t}function o_(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function l_(i,t,e,n){const r=i.getContext(),s=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=i_(e),c=r_(e),u=s_(e),d=a_(e),h=o_(e),m=Kg(e),g=Zg(s),_=r.createProgram();let f,p,S=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(yr).join(`
`),f.length>0&&(f+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(yr).join(`
`),p.length>0&&(p+=`
`)):(f=[Mc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(yr).join(`
`),p=[Mc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+d:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==jn?"#define TONE_MAPPING":"",e.toneMapping!==jn?Ot.tonemapping_pars_fragment:"",e.toneMapping!==jn?$g("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ot.colorspace_pars_fragment,Yg("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(yr).join(`
`)),a=ko(a),a=_c(a,e),a=vc(a,e),o=ko(o),o=_c(o,e),o=vc(o,e),a=xc(a),o=xc(o),e.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,f=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,p=["#define varying in",e.glslVersion===Nl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Nl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const v=S+f+a,E=S+p+o,w=mc(r,r.VERTEX_SHADER,v),b=mc(r,r.FRAGMENT_SHADER,E);r.attachShader(_,w),r.attachShader(_,b),e.index0AttributeName!==void 0?r.bindAttribLocation(_,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(_,0,"position"),r.linkProgram(_);function A(P){if(i.debug.checkShaderErrors){const z=r.getProgramInfoLog(_).trim(),F=r.getShaderInfoLog(w).trim(),H=r.getShaderInfoLog(b).trim();let q=!0,V=!0;if(r.getProgramParameter(_,r.LINK_STATUS)===!1)if(q=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,_,w,b);else{const Q=gc(r,w,"vertex"),G=gc(r,b,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(_,r.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+z+`
`+Q+`
`+G)}else z!==""?console.warn("THREE.WebGLProgram: Program Info Log:",z):(F===""||H==="")&&(V=!1);V&&(P.diagnostics={runnable:q,programLog:z,vertexShader:{log:F,prefix:f},fragmentShader:{log:H,prefix:p}})}r.deleteShader(w),r.deleteShader(b),L=new Os(r,_),T=jg(r,_)}let L;this.getUniforms=function(){return L===void 0&&A(this),L};let T;this.getAttributes=function(){return T===void 0&&A(this),T};let x=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=r.getProgramParameter(_,Vg)),x},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Wg++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=w,this.fragmentShader=b,this}let c_=0;class u_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,r=this._getShaderStage(e),s=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new h_(t),e.set(t,n)),n}}class h_{constructor(t){this.id=c_++,this.code=t,this.usedTimes=0}}function d_(i,t,e,n,r,s,a){const o=new Iu,l=new u_,c=new Set,u=[],d=r.logarithmicDepthBuffer,h=r.vertexTextures;let m=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(T){return c.add(T),T===0?"uv":`uv${T}`}function f(T,x,P,z,F){const H=z.fog,q=F.geometry,V=T.isMeshStandardMaterial?z.environment:null,Q=(T.isMeshStandardMaterial?e:t).get(T.envMap||V),G=Q&&Q.mapping===aa?Q.image.height:null,ht=g[T.type];T.precision!==null&&(m=r.getMaxPrecision(T.precision),m!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",m,"instead."));const ct=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,dt=ct!==void 0?ct.length:0;let Ut=0;q.morphAttributes.position!==void 0&&(Ut=1),q.morphAttributes.normal!==void 0&&(Ut=2),q.morphAttributes.color!==void 0&&(Ut=3);let Ht,W,j,ot;if(ht){const Yt=gn[ht];Ht=Yt.vertexShader,W=Yt.fragmentShader}else Ht=T.vertexShader,W=T.fragmentShader,l.update(T),j=l.getVertexShaderID(T),ot=l.getFragmentShaderID(T);const at=i.getRenderTarget(),yt=F.isInstancedMesh===!0,At=F.isBatchedMesh===!0,Mt=!!T.map,ne=!!T.matcap,C=!!Q,se=!!T.aoMap,qt=!!T.lightMap,Jt=!!T.bumpMap,Et=!!T.normalMap,he=!!T.displacementMap,Dt=!!T.emissiveMap,Nt=!!T.metalnessMap,R=!!T.roughnessMap,M=T.anisotropy>0,k=T.clearcoat>0,J=T.dispersion>0,tt=T.iridescence>0,Z=T.sheen>0,Tt=T.transmission>0,ut=M&&!!T.anisotropyMap,mt=k&&!!T.clearcoatMap,Ft=k&&!!T.clearcoatNormalMap,et=k&&!!T.clearcoatRoughnessMap,pt=tt&&!!T.iridescenceMap,Vt=tt&&!!T.iridescenceThicknessMap,Pt=Z&&!!T.sheenColorMap,gt=Z&&!!T.sheenRoughnessMap,It=!!T.specularMap,zt=!!T.specularColorMap,re=!!T.specularIntensityMap,D=Tt&&!!T.transmissionMap,nt=Tt&&!!T.thicknessMap,Y=!!T.gradientMap,$=!!T.alphaMap,st=T.alphaTest>0,wt=!!T.alphaHash,Xt=!!T.extensions;let de=jn;T.toneMapped&&(at===null||at.isXRRenderTarget===!0)&&(de=i.toneMapping);const Se={shaderID:ht,shaderType:T.type,shaderName:T.name,vertexShader:Ht,fragmentShader:W,defines:T.defines,customVertexShaderID:j,customFragmentShaderID:ot,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:m,batching:At,batchingColor:At&&F._colorsTexture!==null,instancing:yt,instancingColor:yt&&F.instanceColor!==null,instancingMorph:yt&&F.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:at===null?i.outputColorSpace:at.isXRRenderTarget===!0?at.texture.colorSpace:ei,alphaToCoverage:!!T.alphaToCoverage,map:Mt,matcap:ne,envMap:C,envMapMode:C&&Q.mapping,envMapCubeUVHeight:G,aoMap:se,lightMap:qt,bumpMap:Jt,normalMap:Et,displacementMap:h&&he,emissiveMap:Dt,normalMapObjectSpace:Et&&T.normalMapType===Md,normalMapTangentSpace:Et&&T.normalMapType===xd,metalnessMap:Nt,roughnessMap:R,anisotropy:M,anisotropyMap:ut,clearcoat:k,clearcoatMap:mt,clearcoatNormalMap:Ft,clearcoatRoughnessMap:et,dispersion:J,iridescence:tt,iridescenceMap:pt,iridescenceThicknessMap:Vt,sheen:Z,sheenColorMap:Pt,sheenRoughnessMap:gt,specularMap:It,specularColorMap:zt,specularIntensityMap:re,transmission:Tt,transmissionMap:D,thicknessMap:nt,gradientMap:Y,opaque:T.transparent===!1&&T.blending===Zi&&T.alphaToCoverage===!1,alphaMap:$,alphaTest:st,alphaHash:wt,combine:T.combine,mapUv:Mt&&_(T.map.channel),aoMapUv:se&&_(T.aoMap.channel),lightMapUv:qt&&_(T.lightMap.channel),bumpMapUv:Jt&&_(T.bumpMap.channel),normalMapUv:Et&&_(T.normalMap.channel),displacementMapUv:he&&_(T.displacementMap.channel),emissiveMapUv:Dt&&_(T.emissiveMap.channel),metalnessMapUv:Nt&&_(T.metalnessMap.channel),roughnessMapUv:R&&_(T.roughnessMap.channel),anisotropyMapUv:ut&&_(T.anisotropyMap.channel),clearcoatMapUv:mt&&_(T.clearcoatMap.channel),clearcoatNormalMapUv:Ft&&_(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:et&&_(T.clearcoatRoughnessMap.channel),iridescenceMapUv:pt&&_(T.iridescenceMap.channel),iridescenceThicknessMapUv:Vt&&_(T.iridescenceThicknessMap.channel),sheenColorMapUv:Pt&&_(T.sheenColorMap.channel),sheenRoughnessMapUv:gt&&_(T.sheenRoughnessMap.channel),specularMapUv:It&&_(T.specularMap.channel),specularColorMapUv:zt&&_(T.specularColorMap.channel),specularIntensityMapUv:re&&_(T.specularIntensityMap.channel),transmissionMapUv:D&&_(T.transmissionMap.channel),thicknessMapUv:nt&&_(T.thicknessMap.channel),alphaMapUv:$&&_(T.alphaMap.channel),vertexTangents:!!q.attributes.tangent&&(Et||M),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!q.attributes.uv&&(Mt||$),fog:!!H,useFog:T.fog===!0,fogExp2:!!H&&H.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:d,skinning:F.isSkinnedMesh===!0,morphTargets:q.morphAttributes.position!==void 0,morphNormals:q.morphAttributes.normal!==void 0,morphColors:q.morphAttributes.color!==void 0,morphTargetsCount:dt,morphTextureStride:Ut,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:T.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:de,decodeVideoTexture:Mt&&T.map.isVideoTexture===!0&&jt.getTransfer(T.map.colorSpace)===ee,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===sn,flipSided:T.side===De,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:Xt&&T.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Xt&&T.extensions.multiDraw===!0||At)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return Se.vertexUv1s=c.has(1),Se.vertexUv2s=c.has(2),Se.vertexUv3s=c.has(3),c.clear(),Se}function p(T){const x=[];if(T.shaderID?x.push(T.shaderID):(x.push(T.customVertexShaderID),x.push(T.customFragmentShaderID)),T.defines!==void 0)for(const P in T.defines)x.push(P),x.push(T.defines[P]);return T.isRawShaderMaterial===!1&&(S(x,T),v(x,T),x.push(i.outputColorSpace)),x.push(T.customProgramCacheKey),x.join()}function S(T,x){T.push(x.precision),T.push(x.outputColorSpace),T.push(x.envMapMode),T.push(x.envMapCubeUVHeight),T.push(x.mapUv),T.push(x.alphaMapUv),T.push(x.lightMapUv),T.push(x.aoMapUv),T.push(x.bumpMapUv),T.push(x.normalMapUv),T.push(x.displacementMapUv),T.push(x.emissiveMapUv),T.push(x.metalnessMapUv),T.push(x.roughnessMapUv),T.push(x.anisotropyMapUv),T.push(x.clearcoatMapUv),T.push(x.clearcoatNormalMapUv),T.push(x.clearcoatRoughnessMapUv),T.push(x.iridescenceMapUv),T.push(x.iridescenceThicknessMapUv),T.push(x.sheenColorMapUv),T.push(x.sheenRoughnessMapUv),T.push(x.specularMapUv),T.push(x.specularColorMapUv),T.push(x.specularIntensityMapUv),T.push(x.transmissionMapUv),T.push(x.thicknessMapUv),T.push(x.combine),T.push(x.fogExp2),T.push(x.sizeAttenuation),T.push(x.morphTargetsCount),T.push(x.morphAttributeCount),T.push(x.numDirLights),T.push(x.numPointLights),T.push(x.numSpotLights),T.push(x.numSpotLightMaps),T.push(x.numHemiLights),T.push(x.numRectAreaLights),T.push(x.numDirLightShadows),T.push(x.numPointLightShadows),T.push(x.numSpotLightShadows),T.push(x.numSpotLightShadowsWithMaps),T.push(x.numLightProbes),T.push(x.shadowMapType),T.push(x.toneMapping),T.push(x.numClippingPlanes),T.push(x.numClipIntersection),T.push(x.depthPacking)}function v(T,x){o.disableAll(),x.supportsVertexTextures&&o.enable(0),x.instancing&&o.enable(1),x.instancingColor&&o.enable(2),x.instancingMorph&&o.enable(3),x.matcap&&o.enable(4),x.envMap&&o.enable(5),x.normalMapObjectSpace&&o.enable(6),x.normalMapTangentSpace&&o.enable(7),x.clearcoat&&o.enable(8),x.iridescence&&o.enable(9),x.alphaTest&&o.enable(10),x.vertexColors&&o.enable(11),x.vertexAlphas&&o.enable(12),x.vertexUv1s&&o.enable(13),x.vertexUv2s&&o.enable(14),x.vertexUv3s&&o.enable(15),x.vertexTangents&&o.enable(16),x.anisotropy&&o.enable(17),x.alphaHash&&o.enable(18),x.batching&&o.enable(19),x.dispersion&&o.enable(20),x.batchingColor&&o.enable(21),T.push(o.mask),o.disableAll(),x.fog&&o.enable(0),x.useFog&&o.enable(1),x.flatShading&&o.enable(2),x.logarithmicDepthBuffer&&o.enable(3),x.skinning&&o.enable(4),x.morphTargets&&o.enable(5),x.morphNormals&&o.enable(6),x.morphColors&&o.enable(7),x.premultipliedAlpha&&o.enable(8),x.shadowMapEnabled&&o.enable(9),x.doubleSided&&o.enable(10),x.flipSided&&o.enable(11),x.useDepthPacking&&o.enable(12),x.dithering&&o.enable(13),x.transmission&&o.enable(14),x.sheen&&o.enable(15),x.opaque&&o.enable(16),x.pointsUvs&&o.enable(17),x.decodeVideoTexture&&o.enable(18),x.alphaToCoverage&&o.enable(19),T.push(o.mask)}function E(T){const x=g[T.type];let P;if(x){const z=gn[x];P=$d.clone(z.uniforms)}else P=T.uniforms;return P}function w(T,x){let P;for(let z=0,F=u.length;z<F;z++){const H=u[z];if(H.cacheKey===x){P=H,++P.usedTimes;break}}return P===void 0&&(P=new l_(i,x,T,s),u.push(P)),P}function b(T){if(--T.usedTimes===0){const x=u.indexOf(T);u[x]=u[u.length-1],u.pop(),T.destroy()}}function A(T){l.remove(T)}function L(){l.dispose()}return{getParameters:f,getProgramCacheKey:p,getUniforms:E,acquireProgram:w,releaseProgram:b,releaseShaderCache:A,programs:u,dispose:L}}function f_(){let i=new WeakMap;function t(s){let a=i.get(s);return a===void 0&&(a={},i.set(s,a)),a}function e(s){i.delete(s)}function n(s,a,o){i.get(s)[a]=o}function r(){i=new WeakMap}return{get:t,remove:e,update:n,dispose:r}}function p_(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Sc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function yc(){const i=[];let t=0;const e=[],n=[],r=[];function s(){t=0,e.length=0,n.length=0,r.length=0}function a(d,h,m,g,_,f){let p=i[t];return p===void 0?(p={id:d.id,object:d,geometry:h,material:m,groupOrder:g,renderOrder:d.renderOrder,z:_,group:f},i[t]=p):(p.id=d.id,p.object=d,p.geometry=h,p.material=m,p.groupOrder=g,p.renderOrder=d.renderOrder,p.z=_,p.group=f),t++,p}function o(d,h,m,g,_,f){const p=a(d,h,m,g,_,f);m.transmission>0?n.push(p):m.transparent===!0?r.push(p):e.push(p)}function l(d,h,m,g,_,f){const p=a(d,h,m,g,_,f);m.transmission>0?n.unshift(p):m.transparent===!0?r.unshift(p):e.unshift(p)}function c(d,h){e.length>1&&e.sort(d||p_),n.length>1&&n.sort(h||Sc),r.length>1&&r.sort(h||Sc)}function u(){for(let d=t,h=i.length;d<h;d++){const m=i[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:r,init:s,push:o,unshift:l,finish:u,sort:c}}function m_(){let i=new WeakMap;function t(n,r){const s=i.get(n);let a;return s===void 0?(a=new yc,i.set(n,[a])):r>=s.length?(a=new yc,s.push(a)):a=s[r],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function g_(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new N,color:new Gt};break;case"SpotLight":e={position:new N,direction:new N,color:new Gt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new N,color:new Gt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new N,skyColor:new Gt,groundColor:new Gt};break;case"RectAreaLight":e={color:new Gt,position:new N,halfWidth:new N,halfHeight:new N};break}return i[t.id]=e,e}}}function __(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new kt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new kt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new kt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let v_=0;function x_(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function M_(i){const t=new g_,e=__(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new N);const r=new N,s=new ce,a=new ce;function o(c){let u=0,d=0,h=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let m=0,g=0,_=0,f=0,p=0,S=0,v=0,E=0,w=0,b=0,A=0;c.sort(x_);for(let T=0,x=c.length;T<x;T++){const P=c[T],z=P.color,F=P.intensity,H=P.distance,q=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)u+=z.r*F,d+=z.g*F,h+=z.b*F;else if(P.isLightProbe){for(let V=0;V<9;V++)n.probe[V].addScaledVector(P.sh.coefficients[V],F);A++}else if(P.isDirectionalLight){const V=t.get(P);if(V.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const Q=P.shadow,G=e.get(P);G.shadowIntensity=Q.intensity,G.shadowBias=Q.bias,G.shadowNormalBias=Q.normalBias,G.shadowRadius=Q.radius,G.shadowMapSize=Q.mapSize,n.directionalShadow[m]=G,n.directionalShadowMap[m]=q,n.directionalShadowMatrix[m]=P.shadow.matrix,S++}n.directional[m]=V,m++}else if(P.isSpotLight){const V=t.get(P);V.position.setFromMatrixPosition(P.matrixWorld),V.color.copy(z).multiplyScalar(F),V.distance=H,V.coneCos=Math.cos(P.angle),V.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),V.decay=P.decay,n.spot[_]=V;const Q=P.shadow;if(P.map&&(n.spotLightMap[w]=P.map,w++,Q.updateMatrices(P),P.castShadow&&b++),n.spotLightMatrix[_]=Q.matrix,P.castShadow){const G=e.get(P);G.shadowIntensity=Q.intensity,G.shadowBias=Q.bias,G.shadowNormalBias=Q.normalBias,G.shadowRadius=Q.radius,G.shadowMapSize=Q.mapSize,n.spotShadow[_]=G,n.spotShadowMap[_]=q,E++}_++}else if(P.isRectAreaLight){const V=t.get(P);V.color.copy(z).multiplyScalar(F),V.halfWidth.set(P.width*.5,0,0),V.halfHeight.set(0,P.height*.5,0),n.rectArea[f]=V,f++}else if(P.isPointLight){const V=t.get(P);if(V.color.copy(P.color).multiplyScalar(P.intensity),V.distance=P.distance,V.decay=P.decay,P.castShadow){const Q=P.shadow,G=e.get(P);G.shadowIntensity=Q.intensity,G.shadowBias=Q.bias,G.shadowNormalBias=Q.normalBias,G.shadowRadius=Q.radius,G.shadowMapSize=Q.mapSize,G.shadowCameraNear=Q.camera.near,G.shadowCameraFar=Q.camera.far,n.pointShadow[g]=G,n.pointShadowMap[g]=q,n.pointShadowMatrix[g]=P.shadow.matrix,v++}n.point[g]=V,g++}else if(P.isHemisphereLight){const V=t.get(P);V.skyColor.copy(P.color).multiplyScalar(F),V.groundColor.copy(P.groundColor).multiplyScalar(F),n.hemi[p]=V,p++}}f>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=lt.LTC_FLOAT_1,n.rectAreaLTC2=lt.LTC_FLOAT_2):(n.rectAreaLTC1=lt.LTC_HALF_1,n.rectAreaLTC2=lt.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=d,n.ambient[2]=h;const L=n.hash;(L.directionalLength!==m||L.pointLength!==g||L.spotLength!==_||L.rectAreaLength!==f||L.hemiLength!==p||L.numDirectionalShadows!==S||L.numPointShadows!==v||L.numSpotShadows!==E||L.numSpotMaps!==w||L.numLightProbes!==A)&&(n.directional.length=m,n.spot.length=_,n.rectArea.length=f,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.pointShadow.length=v,n.pointShadowMap.length=v,n.spotShadow.length=E,n.spotShadowMap.length=E,n.directionalShadowMatrix.length=S,n.pointShadowMatrix.length=v,n.spotLightMatrix.length=E+w-b,n.spotLightMap.length=w,n.numSpotLightShadowsWithMaps=b,n.numLightProbes=A,L.directionalLength=m,L.pointLength=g,L.spotLength=_,L.rectAreaLength=f,L.hemiLength=p,L.numDirectionalShadows=S,L.numPointShadows=v,L.numSpotShadows=E,L.numSpotMaps=w,L.numLightProbes=A,n.version=v_++)}function l(c,u){let d=0,h=0,m=0,g=0,_=0;const f=u.matrixWorldInverse;for(let p=0,S=c.length;p<S;p++){const v=c[p];if(v.isDirectionalLight){const E=n.directional[d];E.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(f),d++}else if(v.isSpotLight){const E=n.spot[m];E.position.setFromMatrixPosition(v.matrixWorld),E.position.applyMatrix4(f),E.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(f),m++}else if(v.isRectAreaLight){const E=n.rectArea[g];E.position.setFromMatrixPosition(v.matrixWorld),E.position.applyMatrix4(f),a.identity(),s.copy(v.matrixWorld),s.premultiply(f),a.extractRotation(s),E.halfWidth.set(v.width*.5,0,0),E.halfHeight.set(0,v.height*.5,0),E.halfWidth.applyMatrix4(a),E.halfHeight.applyMatrix4(a),g++}else if(v.isPointLight){const E=n.point[h];E.position.setFromMatrixPosition(v.matrixWorld),E.position.applyMatrix4(f),h++}else if(v.isHemisphereLight){const E=n.hemi[_];E.direction.setFromMatrixPosition(v.matrixWorld),E.direction.transformDirection(f),_++}}}return{setup:o,setupView:l,state:n}}function Ec(i){const t=new M_(i),e=[],n=[];function r(u){c.camera=u,e.length=0,n.length=0}function s(u){e.push(u)}function a(u){n.push(u)}function o(){t.setup(e)}function l(u){t.setupView(e,u)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:r,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:a}}function S_(i){let t=new WeakMap;function e(r,s=0){const a=t.get(r);let o;return a===void 0?(o=new Ec(i),t.set(r,[o])):s>=a.length?(o=new Ec(i),a.push(o)):o=a[s],o}function n(){t=new WeakMap}return{get:e,dispose:n}}class y_ extends Ei{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=_d,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class E_ extends Ei{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const T_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,b_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function A_(i,t,e){let n=new ku;const r=new kt,s=new kt,a=new xe,o=new y_({depthPacking:vd}),l=new E_,c={},u=e.maxTextureSize,d={[Qn]:De,[De]:Qn,[sn]:sn},h=new ti({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new kt},radius:{value:4}},vertexShader:T_,fragmentShader:b_}),m=h.clone();m.defines.HORIZONTAL_PASS=1;const g=new Oe;g.setAttribute("position",new Me(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Fe(g,h),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=gu;let p=this.type;this.render=function(b,A,L){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||b.length===0)return;const T=i.getRenderTarget(),x=i.getActiveCubeFace(),P=i.getActiveMipmapLevel(),z=i.state;z.setBlending(Zn),z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);const F=p!==Pn&&this.type===Pn,H=p===Pn&&this.type!==Pn;for(let q=0,V=b.length;q<V;q++){const Q=b[q],G=Q.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",Q,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;r.copy(G.mapSize);const ht=G.getFrameExtents();if(r.multiply(ht),s.copy(G.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/ht.x),r.x=s.x*ht.x,G.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/ht.y),r.y=s.y*ht.y,G.mapSize.y=s.y)),G.map===null||F===!0||H===!0){const dt=this.type!==Pn?{minFilter:Te,magFilter:Te}:{};G.map!==null&&G.map.dispose(),G.map=new yi(r.x,r.y,dt),G.map.texture.name=Q.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();const ct=G.getViewportCount();for(let dt=0;dt<ct;dt++){const Ut=G.getViewport(dt);a.set(s.x*Ut.x,s.y*Ut.y,s.x*Ut.z,s.y*Ut.w),z.viewport(a),G.updateMatrices(Q,dt),n=G.getFrustum(),E(A,L,G.camera,Q,this.type)}G.isPointLightShadow!==!0&&this.type===Pn&&S(G,L),G.needsUpdate=!1}p=this.type,f.needsUpdate=!1,i.setRenderTarget(T,x,P)};function S(b,A){const L=t.update(_);h.defines.VSM_SAMPLES!==b.blurSamples&&(h.defines.VSM_SAMPLES=b.blurSamples,m.defines.VSM_SAMPLES=b.blurSamples,h.needsUpdate=!0,m.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new yi(r.x,r.y)),h.uniforms.shadow_pass.value=b.map.texture,h.uniforms.resolution.value=b.mapSize,h.uniforms.radius.value=b.radius,i.setRenderTarget(b.mapPass),i.clear(),i.renderBufferDirect(A,null,L,h,_,null),m.uniforms.shadow_pass.value=b.mapPass.texture,m.uniforms.resolution.value=b.mapSize,m.uniforms.radius.value=b.radius,i.setRenderTarget(b.map),i.clear(),i.renderBufferDirect(A,null,L,m,_,null)}function v(b,A,L,T){let x=null;const P=L.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(P!==void 0)x=P;else if(x=L.isPointLight===!0?l:o,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const z=x.uuid,F=A.uuid;let H=c[z];H===void 0&&(H={},c[z]=H);let q=H[F];q===void 0&&(q=x.clone(),H[F]=q,A.addEventListener("dispose",w)),x=q}if(x.visible=A.visible,x.wireframe=A.wireframe,T===Pn?x.side=A.shadowSide!==null?A.shadowSide:A.side:x.side=A.shadowSide!==null?A.shadowSide:d[A.side],x.alphaMap=A.alphaMap,x.alphaTest=A.alphaTest,x.map=A.map,x.clipShadows=A.clipShadows,x.clippingPlanes=A.clippingPlanes,x.clipIntersection=A.clipIntersection,x.displacementMap=A.displacementMap,x.displacementScale=A.displacementScale,x.displacementBias=A.displacementBias,x.wireframeLinewidth=A.wireframeLinewidth,x.linewidth=A.linewidth,L.isPointLight===!0&&x.isMeshDistanceMaterial===!0){const z=i.properties.get(x);z.light=L}return x}function E(b,A,L,T,x){if(b.visible===!1)return;if(b.layers.test(A.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&x===Pn)&&(!b.frustumCulled||n.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,b.matrixWorld);const F=t.update(b),H=b.material;if(Array.isArray(H)){const q=F.groups;for(let V=0,Q=q.length;V<Q;V++){const G=q[V],ht=H[G.materialIndex];if(ht&&ht.visible){const ct=v(b,ht,T,x);b.onBeforeShadow(i,b,A,L,F,ct,G),i.renderBufferDirect(L,null,F,ct,b,G),b.onAfterShadow(i,b,A,L,F,ct,G)}}}else if(H.visible){const q=v(b,H,T,x);b.onBeforeShadow(i,b,A,L,F,q,null),i.renderBufferDirect(L,null,F,q,b,null),b.onAfterShadow(i,b,A,L,F,q,null)}}const z=b.children;for(let F=0,H=z.length;F<H;F++)E(z[F],A,L,T,x)}function w(b){b.target.removeEventListener("dispose",w);for(const L in c){const T=c[L],x=b.target.uuid;x in T&&(T[x].dispose(),delete T[x])}}}function w_(i){function t(){let D=!1;const nt=new xe;let Y=null;const $=new xe(0,0,0,0);return{setMask:function(st){Y!==st&&!D&&(i.colorMask(st,st,st,st),Y=st)},setLocked:function(st){D=st},setClear:function(st,wt,Xt,de,Se){Se===!0&&(st*=de,wt*=de,Xt*=de),nt.set(st,wt,Xt,de),$.equals(nt)===!1&&(i.clearColor(st,wt,Xt,de),$.copy(nt))},reset:function(){D=!1,Y=null,$.set(-1,0,0,0)}}}function e(){let D=!1,nt=null,Y=null,$=null;return{setTest:function(st){st?ot(i.DEPTH_TEST):at(i.DEPTH_TEST)},setMask:function(st){nt!==st&&!D&&(i.depthMask(st),nt=st)},setFunc:function(st){if(Y!==st){switch(st){case td:i.depthFunc(i.NEVER);break;case ed:i.depthFunc(i.ALWAYS);break;case nd:i.depthFunc(i.LESS);break;case Hs:i.depthFunc(i.LEQUAL);break;case id:i.depthFunc(i.EQUAL);break;case rd:i.depthFunc(i.GEQUAL);break;case sd:i.depthFunc(i.GREATER);break;case ad:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Y=st}},setLocked:function(st){D=st},setClear:function(st){$!==st&&(i.clearDepth(st),$=st)},reset:function(){D=!1,nt=null,Y=null,$=null}}}function n(){let D=!1,nt=null,Y=null,$=null,st=null,wt=null,Xt=null,de=null,Se=null;return{setTest:function(Yt){D||(Yt?ot(i.STENCIL_TEST):at(i.STENCIL_TEST))},setMask:function(Yt){nt!==Yt&&!D&&(i.stencilMask(Yt),nt=Yt)},setFunc:function(Yt,Sn,dn){(Y!==Yt||$!==Sn||st!==dn)&&(i.stencilFunc(Yt,Sn,dn),Y=Yt,$=Sn,st=dn)},setOp:function(Yt,Sn,dn){(wt!==Yt||Xt!==Sn||de!==dn)&&(i.stencilOp(Yt,Sn,dn),wt=Yt,Xt=Sn,de=dn)},setLocked:function(Yt){D=Yt},setClear:function(Yt){Se!==Yt&&(i.clearStencil(Yt),Se=Yt)},reset:function(){D=!1,nt=null,Y=null,$=null,st=null,wt=null,Xt=null,de=null,Se=null}}}const r=new t,s=new e,a=new n,o=new WeakMap,l=new WeakMap;let c={},u={},d=new WeakMap,h=[],m=null,g=!1,_=null,f=null,p=null,S=null,v=null,E=null,w=null,b=new Gt(0,0,0),A=0,L=!1,T=null,x=null,P=null,z=null,F=null;const H=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,V=0;const Q=i.getParameter(i.VERSION);Q.indexOf("WebGL")!==-1?(V=parseFloat(/^WebGL (\d)/.exec(Q)[1]),q=V>=1):Q.indexOf("OpenGL ES")!==-1&&(V=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),q=V>=2);let G=null,ht={};const ct=i.getParameter(i.SCISSOR_BOX),dt=i.getParameter(i.VIEWPORT),Ut=new xe().fromArray(ct),Ht=new xe().fromArray(dt);function W(D,nt,Y,$){const st=new Uint8Array(4),wt=i.createTexture();i.bindTexture(D,wt),i.texParameteri(D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(D,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Xt=0;Xt<Y;Xt++)D===i.TEXTURE_3D||D===i.TEXTURE_2D_ARRAY?i.texImage3D(nt,0,i.RGBA,1,1,$,0,i.RGBA,i.UNSIGNED_BYTE,st):i.texImage2D(nt+Xt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,st);return wt}const j={};j[i.TEXTURE_2D]=W(i.TEXTURE_2D,i.TEXTURE_2D,1),j[i.TEXTURE_CUBE_MAP]=W(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),j[i.TEXTURE_2D_ARRAY]=W(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),j[i.TEXTURE_3D]=W(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),s.setClear(1),a.setClear(0),ot(i.DEPTH_TEST),s.setFunc(Hs),Jt(!1),Et(Pl),ot(i.CULL_FACE),se(Zn);function ot(D){c[D]!==!0&&(i.enable(D),c[D]=!0)}function at(D){c[D]!==!1&&(i.disable(D),c[D]=!1)}function yt(D,nt){return u[D]!==nt?(i.bindFramebuffer(D,nt),u[D]=nt,D===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=nt),D===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=nt),!0):!1}function At(D,nt){let Y=h,$=!1;if(D){Y=d.get(nt),Y===void 0&&(Y=[],d.set(nt,Y));const st=D.textures;if(Y.length!==st.length||Y[0]!==i.COLOR_ATTACHMENT0){for(let wt=0,Xt=st.length;wt<Xt;wt++)Y[wt]=i.COLOR_ATTACHMENT0+wt;Y.length=st.length,$=!0}}else Y[0]!==i.BACK&&(Y[0]=i.BACK,$=!0);$&&i.drawBuffers(Y)}function Mt(D){return m!==D?(i.useProgram(D),m=D,!0):!1}const ne={[mi]:i.FUNC_ADD,[Oh]:i.FUNC_SUBTRACT,[Bh]:i.FUNC_REVERSE_SUBTRACT};ne[zh]=i.MIN,ne[kh]=i.MAX;const C={[Hh]:i.ZERO,[Gh]:i.ONE,[Vh]:i.SRC_COLOR,[ao]:i.SRC_ALPHA,[Kh]:i.SRC_ALPHA_SATURATE,[Yh]:i.DST_COLOR,[Xh]:i.DST_ALPHA,[Wh]:i.ONE_MINUS_SRC_COLOR,[oo]:i.ONE_MINUS_SRC_ALPHA,[$h]:i.ONE_MINUS_DST_COLOR,[qh]:i.ONE_MINUS_DST_ALPHA,[Zh]:i.CONSTANT_COLOR,[jh]:i.ONE_MINUS_CONSTANT_COLOR,[Jh]:i.CONSTANT_ALPHA,[Qh]:i.ONE_MINUS_CONSTANT_ALPHA};function se(D,nt,Y,$,st,wt,Xt,de,Se,Yt){if(D===Zn){g===!0&&(at(i.BLEND),g=!1);return}if(g===!1&&(ot(i.BLEND),g=!0),D!==Fh){if(D!==_||Yt!==L){if((f!==mi||v!==mi)&&(i.blendEquation(i.FUNC_ADD),f=mi,v=mi),Yt)switch(D){case Zi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ll:i.blendFunc(i.ONE,i.ONE);break;case Dl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Il:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case Zi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ll:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Dl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Il:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}p=null,S=null,E=null,w=null,b.set(0,0,0),A=0,_=D,L=Yt}return}st=st||nt,wt=wt||Y,Xt=Xt||$,(nt!==f||st!==v)&&(i.blendEquationSeparate(ne[nt],ne[st]),f=nt,v=st),(Y!==p||$!==S||wt!==E||Xt!==w)&&(i.blendFuncSeparate(C[Y],C[$],C[wt],C[Xt]),p=Y,S=$,E=wt,w=Xt),(de.equals(b)===!1||Se!==A)&&(i.blendColor(de.r,de.g,de.b,Se),b.copy(de),A=Se),_=D,L=!1}function qt(D,nt){D.side===sn?at(i.CULL_FACE):ot(i.CULL_FACE);let Y=D.side===De;nt&&(Y=!Y),Jt(Y),D.blending===Zi&&D.transparent===!1?se(Zn):se(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),s.setFunc(D.depthFunc),s.setTest(D.depthTest),s.setMask(D.depthWrite),r.setMask(D.colorWrite);const $=D.stencilWrite;a.setTest($),$&&(a.setMask(D.stencilWriteMask),a.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),a.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),Dt(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?ot(i.SAMPLE_ALPHA_TO_COVERAGE):at(i.SAMPLE_ALPHA_TO_COVERAGE)}function Jt(D){T!==D&&(D?i.frontFace(i.CW):i.frontFace(i.CCW),T=D)}function Et(D){D!==Ih?(ot(i.CULL_FACE),D!==x&&(D===Pl?i.cullFace(i.BACK):D===Uh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):at(i.CULL_FACE),x=D}function he(D){D!==P&&(q&&i.lineWidth(D),P=D)}function Dt(D,nt,Y){D?(ot(i.POLYGON_OFFSET_FILL),(z!==nt||F!==Y)&&(i.polygonOffset(nt,Y),z=nt,F=Y)):at(i.POLYGON_OFFSET_FILL)}function Nt(D){D?ot(i.SCISSOR_TEST):at(i.SCISSOR_TEST)}function R(D){D===void 0&&(D=i.TEXTURE0+H-1),G!==D&&(i.activeTexture(D),G=D)}function M(D,nt,Y){Y===void 0&&(G===null?Y=i.TEXTURE0+H-1:Y=G);let $=ht[Y];$===void 0&&($={type:void 0,texture:void 0},ht[Y]=$),($.type!==D||$.texture!==nt)&&(G!==Y&&(i.activeTexture(Y),G=Y),i.bindTexture(D,nt||j[D]),$.type=D,$.texture=nt)}function k(){const D=ht[G];D!==void 0&&D.type!==void 0&&(i.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function J(){try{i.compressedTexImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function tt(){try{i.compressedTexImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Z(){try{i.texSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Tt(){try{i.texSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ut(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function mt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ft(){try{i.texStorage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function et(){try{i.texStorage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function pt(){try{i.texImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Vt(){try{i.texImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Pt(D){Ut.equals(D)===!1&&(i.scissor(D.x,D.y,D.z,D.w),Ut.copy(D))}function gt(D){Ht.equals(D)===!1&&(i.viewport(D.x,D.y,D.z,D.w),Ht.copy(D))}function It(D,nt){let Y=l.get(nt);Y===void 0&&(Y=new WeakMap,l.set(nt,Y));let $=Y.get(D);$===void 0&&($=i.getUniformBlockIndex(nt,D.name),Y.set(D,$))}function zt(D,nt){const $=l.get(nt).get(D);o.get(nt)!==$&&(i.uniformBlockBinding(nt,$,D.__bindingPointIndex),o.set(nt,$))}function re(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},G=null,ht={},u={},d=new WeakMap,h=[],m=null,g=!1,_=null,f=null,p=null,S=null,v=null,E=null,w=null,b=new Gt(0,0,0),A=0,L=!1,T=null,x=null,P=null,z=null,F=null,Ut.set(0,0,i.canvas.width,i.canvas.height),Ht.set(0,0,i.canvas.width,i.canvas.height),r.reset(),s.reset(),a.reset()}return{buffers:{color:r,depth:s,stencil:a},enable:ot,disable:at,bindFramebuffer:yt,drawBuffers:At,useProgram:Mt,setBlending:se,setMaterial:qt,setFlipSided:Jt,setCullFace:Et,setLineWidth:he,setPolygonOffset:Dt,setScissorTest:Nt,activeTexture:R,bindTexture:M,unbindTexture:k,compressedTexImage2D:J,compressedTexImage3D:tt,texImage2D:pt,texImage3D:Vt,updateUBOMapping:It,uniformBlockBinding:zt,texStorage2D:Ft,texStorage3D:et,texSubImage2D:Z,texSubImage3D:Tt,compressedTexSubImage2D:ut,compressedTexSubImage3D:mt,scissor:Pt,viewport:gt,reset:re}}function Tc(i,t,e,n){const r=R_(n);switch(e){case yu:return i*t;case Tu:return i*t;case bu:return i*t*2;case Au:return i*t/r.components*r.byteLength;case nl:return i*t/r.components*r.byteLength;case wu:return i*t*2/r.components*r.byteLength;case il:return i*t*2/r.components*r.byteLength;case Eu:return i*t*3/r.components*r.byteLength;case on:return i*t*4/r.components*r.byteLength;case rl:return i*t*4/r.components*r.byteLength;case Ls:case Ds:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Is:case Us:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case fo:case mo:return Math.max(i,16)*Math.max(t,8)/4;case ho:case po:return Math.max(i,8)*Math.max(t,8)/2;case go:case _o:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case vo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case xo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Mo:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case So:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case yo:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Eo:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case To:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case bo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Ao:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case wo:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Ro:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Co:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Po:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Lo:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Do:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Ns:case Io:case Uo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Ru:case No:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Fo:case Oo:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function R_(i){switch(i){case Nn:case xu:return{byteLength:1,components:1};case Cr:case Mu:case Ur:return{byteLength:2,components:1};case tl:case el:return{byteLength:2,components:4};case Si:case Qo:case Dn:return{byteLength:4,components:1};case Su:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function C_(i,t,e,n,r,s,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new kt,u=new WeakMap;let d;const h=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,M){return m?new OffscreenCanvas(R,M):Ys("canvas")}function _(R,M,k){let J=1;const tt=Nt(R);if((tt.width>k||tt.height>k)&&(J=k/Math.max(tt.width,tt.height)),J<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){const Z=Math.floor(J*tt.width),Tt=Math.floor(J*tt.height);d===void 0&&(d=g(Z,Tt));const ut=M?g(Z,Tt):d;return ut.width=Z,ut.height=Tt,ut.getContext("2d").drawImage(R,0,0,Z,Tt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+tt.width+"x"+tt.height+") to ("+Z+"x"+Tt+")."),ut}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+tt.width+"x"+tt.height+")."),R;return R}function f(R){return R.generateMipmaps&&R.minFilter!==Te&&R.minFilter!==an}function p(R){i.generateMipmap(R)}function S(R,M,k,J,tt=!1){if(R!==null){if(i[R]!==void 0)return i[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let Z=M;if(M===i.RED&&(k===i.FLOAT&&(Z=i.R32F),k===i.HALF_FLOAT&&(Z=i.R16F),k===i.UNSIGNED_BYTE&&(Z=i.R8)),M===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(Z=i.R8UI),k===i.UNSIGNED_SHORT&&(Z=i.R16UI),k===i.UNSIGNED_INT&&(Z=i.R32UI),k===i.BYTE&&(Z=i.R8I),k===i.SHORT&&(Z=i.R16I),k===i.INT&&(Z=i.R32I)),M===i.RG&&(k===i.FLOAT&&(Z=i.RG32F),k===i.HALF_FLOAT&&(Z=i.RG16F),k===i.UNSIGNED_BYTE&&(Z=i.RG8)),M===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(Z=i.RG8UI),k===i.UNSIGNED_SHORT&&(Z=i.RG16UI),k===i.UNSIGNED_INT&&(Z=i.RG32UI),k===i.BYTE&&(Z=i.RG8I),k===i.SHORT&&(Z=i.RG16I),k===i.INT&&(Z=i.RG32I)),M===i.RGB&&k===i.UNSIGNED_INT_5_9_9_9_REV&&(Z=i.RGB9_E5),M===i.RGBA){const Tt=tt?Vs:jt.getTransfer(J);k===i.FLOAT&&(Z=i.RGBA32F),k===i.HALF_FLOAT&&(Z=i.RGBA16F),k===i.UNSIGNED_BYTE&&(Z=Tt===ee?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT_4_4_4_4&&(Z=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(Z=i.RGB5_A1)}return(Z===i.R16F||Z===i.R32F||Z===i.RG16F||Z===i.RG32F||Z===i.RGBA16F||Z===i.RGBA32F)&&t.get("EXT_color_buffer_float"),Z}function v(R,M){let k;return R?M===null||M===Si||M===ir?k=i.DEPTH24_STENCIL8:M===Dn?k=i.DEPTH32F_STENCIL8:M===Cr&&(k=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===Si||M===ir?k=i.DEPTH_COMPONENT24:M===Dn?k=i.DEPTH_COMPONENT32F:M===Cr&&(k=i.DEPTH_COMPONENT16),k}function E(R,M){return f(R)===!0||R.isFramebufferTexture&&R.minFilter!==Te&&R.minFilter!==an?Math.log2(Math.max(M.width,M.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?M.mipmaps.length:1}function w(R){const M=R.target;M.removeEventListener("dispose",w),A(M),M.isVideoTexture&&u.delete(M)}function b(R){const M=R.target;M.removeEventListener("dispose",b),T(M)}function A(R){const M=n.get(R);if(M.__webglInit===void 0)return;const k=R.source,J=h.get(k);if(J){const tt=J[M.__cacheKey];tt.usedTimes--,tt.usedTimes===0&&L(R),Object.keys(J).length===0&&h.delete(k)}n.remove(R)}function L(R){const M=n.get(R);i.deleteTexture(M.__webglTexture);const k=R.source,J=h.get(k);delete J[M.__cacheKey],a.memory.textures--}function T(R){const M=n.get(R);if(R.depthTexture&&R.depthTexture.dispose(),R.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(M.__webglFramebuffer[J]))for(let tt=0;tt<M.__webglFramebuffer[J].length;tt++)i.deleteFramebuffer(M.__webglFramebuffer[J][tt]);else i.deleteFramebuffer(M.__webglFramebuffer[J]);M.__webglDepthbuffer&&i.deleteRenderbuffer(M.__webglDepthbuffer[J])}else{if(Array.isArray(M.__webglFramebuffer))for(let J=0;J<M.__webglFramebuffer.length;J++)i.deleteFramebuffer(M.__webglFramebuffer[J]);else i.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&i.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&i.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let J=0;J<M.__webglColorRenderbuffer.length;J++)M.__webglColorRenderbuffer[J]&&i.deleteRenderbuffer(M.__webglColorRenderbuffer[J]);M.__webglDepthRenderbuffer&&i.deleteRenderbuffer(M.__webglDepthRenderbuffer)}const k=R.textures;for(let J=0,tt=k.length;J<tt;J++){const Z=n.get(k[J]);Z.__webglTexture&&(i.deleteTexture(Z.__webglTexture),a.memory.textures--),n.remove(k[J])}n.remove(R)}let x=0;function P(){x=0}function z(){const R=x;return R>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+r.maxTextures),x+=1,R}function F(R){const M=[];return M.push(R.wrapS),M.push(R.wrapT),M.push(R.wrapR||0),M.push(R.magFilter),M.push(R.minFilter),M.push(R.anisotropy),M.push(R.internalFormat),M.push(R.format),M.push(R.type),M.push(R.generateMipmaps),M.push(R.premultiplyAlpha),M.push(R.flipY),M.push(R.unpackAlignment),M.push(R.colorSpace),M.join()}function H(R,M){const k=n.get(R);if(R.isVideoTexture&&he(R),R.isRenderTargetTexture===!1&&R.version>0&&k.__version!==R.version){const J=R.image;if(J===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Ht(k,R,M);return}}e.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+M)}function q(R,M){const k=n.get(R);if(R.version>0&&k.__version!==R.version){Ht(k,R,M);return}e.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+M)}function V(R,M){const k=n.get(R);if(R.version>0&&k.__version!==R.version){Ht(k,R,M);return}e.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+M)}function Q(R,M){const k=n.get(R);if(R.version>0&&k.__version!==R.version){W(k,R,M);return}e.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+M)}const G={[Gs]:i.REPEAT,[_i]:i.CLAMP_TO_EDGE,[uo]:i.MIRRORED_REPEAT},ht={[Te]:i.NEAREST,[gd]:i.NEAREST_MIPMAP_NEAREST,[Yr]:i.NEAREST_MIPMAP_LINEAR,[an]:i.LINEAR,[Sa]:i.LINEAR_MIPMAP_NEAREST,[vi]:i.LINEAR_MIPMAP_LINEAR},ct={[Sd]:i.NEVER,[wd]:i.ALWAYS,[yd]:i.LESS,[Cu]:i.LEQUAL,[Ed]:i.EQUAL,[Ad]:i.GEQUAL,[Td]:i.GREATER,[bd]:i.NOTEQUAL};function dt(R,M){if(M.type===Dn&&t.has("OES_texture_float_linear")===!1&&(M.magFilter===an||M.magFilter===Sa||M.magFilter===Yr||M.magFilter===vi||M.minFilter===an||M.minFilter===Sa||M.minFilter===Yr||M.minFilter===vi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(R,i.TEXTURE_WRAP_S,G[M.wrapS]),i.texParameteri(R,i.TEXTURE_WRAP_T,G[M.wrapT]),(R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY)&&i.texParameteri(R,i.TEXTURE_WRAP_R,G[M.wrapR]),i.texParameteri(R,i.TEXTURE_MAG_FILTER,ht[M.magFilter]),i.texParameteri(R,i.TEXTURE_MIN_FILTER,ht[M.minFilter]),M.compareFunction&&(i.texParameteri(R,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(R,i.TEXTURE_COMPARE_FUNC,ct[M.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===Te||M.minFilter!==Yr&&M.minFilter!==vi||M.type===Dn&&t.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||n.get(M).__currentAnisotropy){const k=t.get("EXT_texture_filter_anisotropic");i.texParameterf(R,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,r.getMaxAnisotropy())),n.get(M).__currentAnisotropy=M.anisotropy}}}function Ut(R,M){let k=!1;R.__webglInit===void 0&&(R.__webglInit=!0,M.addEventListener("dispose",w));const J=M.source;let tt=h.get(J);tt===void 0&&(tt={},h.set(J,tt));const Z=F(M);if(Z!==R.__cacheKey){tt[Z]===void 0&&(tt[Z]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,k=!0),tt[Z].usedTimes++;const Tt=tt[R.__cacheKey];Tt!==void 0&&(tt[R.__cacheKey].usedTimes--,Tt.usedTimes===0&&L(M)),R.__cacheKey=Z,R.__webglTexture=tt[Z].texture}return k}function Ht(R,M,k){let J=i.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(J=i.TEXTURE_2D_ARRAY),M.isData3DTexture&&(J=i.TEXTURE_3D);const tt=Ut(R,M),Z=M.source;e.bindTexture(J,R.__webglTexture,i.TEXTURE0+k);const Tt=n.get(Z);if(Z.version!==Tt.__version||tt===!0){e.activeTexture(i.TEXTURE0+k);const ut=jt.getPrimaries(jt.workingColorSpace),mt=M.colorSpace===Yn?null:jt.getPrimaries(M.colorSpace),Ft=M.colorSpace===Yn||ut===mt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ft);let et=_(M.image,!1,r.maxTextureSize);et=Dt(M,et);const pt=s.convert(M.format,M.colorSpace),Vt=s.convert(M.type);let Pt=S(M.internalFormat,pt,Vt,M.colorSpace,M.isVideoTexture);dt(J,M);let gt;const It=M.mipmaps,zt=M.isVideoTexture!==!0,re=Tt.__version===void 0||tt===!0,D=Z.dataReady,nt=E(M,et);if(M.isDepthTexture)Pt=v(M.format===rr,M.type),re&&(zt?e.texStorage2D(i.TEXTURE_2D,1,Pt,et.width,et.height):e.texImage2D(i.TEXTURE_2D,0,Pt,et.width,et.height,0,pt,Vt,null));else if(M.isDataTexture)if(It.length>0){zt&&re&&e.texStorage2D(i.TEXTURE_2D,nt,Pt,It[0].width,It[0].height);for(let Y=0,$=It.length;Y<$;Y++)gt=It[Y],zt?D&&e.texSubImage2D(i.TEXTURE_2D,Y,0,0,gt.width,gt.height,pt,Vt,gt.data):e.texImage2D(i.TEXTURE_2D,Y,Pt,gt.width,gt.height,0,pt,Vt,gt.data);M.generateMipmaps=!1}else zt?(re&&e.texStorage2D(i.TEXTURE_2D,nt,Pt,et.width,et.height),D&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,et.width,et.height,pt,Vt,et.data)):e.texImage2D(i.TEXTURE_2D,0,Pt,et.width,et.height,0,pt,Vt,et.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){zt&&re&&e.texStorage3D(i.TEXTURE_2D_ARRAY,nt,Pt,It[0].width,It[0].height,et.depth);for(let Y=0,$=It.length;Y<$;Y++)if(gt=It[Y],M.format!==on)if(pt!==null)if(zt){if(D)if(M.layerUpdates.size>0){const st=Tc(gt.width,gt.height,M.format,M.type);for(const wt of M.layerUpdates){const Xt=gt.data.subarray(wt*st/gt.data.BYTES_PER_ELEMENT,(wt+1)*st/gt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Y,0,0,wt,gt.width,gt.height,1,pt,Xt,0,0)}M.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Y,0,0,0,gt.width,gt.height,et.depth,pt,gt.data,0,0)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Y,Pt,gt.width,gt.height,et.depth,0,gt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else zt?D&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,Y,0,0,0,gt.width,gt.height,et.depth,pt,Vt,gt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,Y,Pt,gt.width,gt.height,et.depth,0,pt,Vt,gt.data)}else{zt&&re&&e.texStorage2D(i.TEXTURE_2D,nt,Pt,It[0].width,It[0].height);for(let Y=0,$=It.length;Y<$;Y++)gt=It[Y],M.format!==on?pt!==null?zt?D&&e.compressedTexSubImage2D(i.TEXTURE_2D,Y,0,0,gt.width,gt.height,pt,gt.data):e.compressedTexImage2D(i.TEXTURE_2D,Y,Pt,gt.width,gt.height,0,gt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):zt?D&&e.texSubImage2D(i.TEXTURE_2D,Y,0,0,gt.width,gt.height,pt,Vt,gt.data):e.texImage2D(i.TEXTURE_2D,Y,Pt,gt.width,gt.height,0,pt,Vt,gt.data)}else if(M.isDataArrayTexture)if(zt){if(re&&e.texStorage3D(i.TEXTURE_2D_ARRAY,nt,Pt,et.width,et.height,et.depth),D)if(M.layerUpdates.size>0){const Y=Tc(et.width,et.height,M.format,M.type);for(const $ of M.layerUpdates){const st=et.data.subarray($*Y/et.data.BYTES_PER_ELEMENT,($+1)*Y/et.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,$,et.width,et.height,1,pt,Vt,st)}M.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,et.width,et.height,et.depth,pt,Vt,et.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Pt,et.width,et.height,et.depth,0,pt,Vt,et.data);else if(M.isData3DTexture)zt?(re&&e.texStorage3D(i.TEXTURE_3D,nt,Pt,et.width,et.height,et.depth),D&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,et.width,et.height,et.depth,pt,Vt,et.data)):e.texImage3D(i.TEXTURE_3D,0,Pt,et.width,et.height,et.depth,0,pt,Vt,et.data);else if(M.isFramebufferTexture){if(re)if(zt)e.texStorage2D(i.TEXTURE_2D,nt,Pt,et.width,et.height);else{let Y=et.width,$=et.height;for(let st=0;st<nt;st++)e.texImage2D(i.TEXTURE_2D,st,Pt,Y,$,0,pt,Vt,null),Y>>=1,$>>=1}}else if(It.length>0){if(zt&&re){const Y=Nt(It[0]);e.texStorage2D(i.TEXTURE_2D,nt,Pt,Y.width,Y.height)}for(let Y=0,$=It.length;Y<$;Y++)gt=It[Y],zt?D&&e.texSubImage2D(i.TEXTURE_2D,Y,0,0,pt,Vt,gt):e.texImage2D(i.TEXTURE_2D,Y,Pt,pt,Vt,gt);M.generateMipmaps=!1}else if(zt){if(re){const Y=Nt(et);e.texStorage2D(i.TEXTURE_2D,nt,Pt,Y.width,Y.height)}D&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,pt,Vt,et)}else e.texImage2D(i.TEXTURE_2D,0,Pt,pt,Vt,et);f(M)&&p(J),Tt.__version=Z.version,M.onUpdate&&M.onUpdate(M)}R.__version=M.version}function W(R,M,k){if(M.image.length!==6)return;const J=Ut(R,M),tt=M.source;e.bindTexture(i.TEXTURE_CUBE_MAP,R.__webglTexture,i.TEXTURE0+k);const Z=n.get(tt);if(tt.version!==Z.__version||J===!0){e.activeTexture(i.TEXTURE0+k);const Tt=jt.getPrimaries(jt.workingColorSpace),ut=M.colorSpace===Yn?null:jt.getPrimaries(M.colorSpace),mt=M.colorSpace===Yn||Tt===ut?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,mt);const Ft=M.isCompressedTexture||M.image[0].isCompressedTexture,et=M.image[0]&&M.image[0].isDataTexture,pt=[];for(let $=0;$<6;$++)!Ft&&!et?pt[$]=_(M.image[$],!0,r.maxCubemapSize):pt[$]=et?M.image[$].image:M.image[$],pt[$]=Dt(M,pt[$]);const Vt=pt[0],Pt=s.convert(M.format,M.colorSpace),gt=s.convert(M.type),It=S(M.internalFormat,Pt,gt,M.colorSpace),zt=M.isVideoTexture!==!0,re=Z.__version===void 0||J===!0,D=tt.dataReady;let nt=E(M,Vt);dt(i.TEXTURE_CUBE_MAP,M);let Y;if(Ft){zt&&re&&e.texStorage2D(i.TEXTURE_CUBE_MAP,nt,It,Vt.width,Vt.height);for(let $=0;$<6;$++){Y=pt[$].mipmaps;for(let st=0;st<Y.length;st++){const wt=Y[st];M.format!==on?Pt!==null?zt?D&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,st,0,0,wt.width,wt.height,Pt,wt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,st,It,wt.width,wt.height,0,wt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):zt?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,st,0,0,wt.width,wt.height,Pt,gt,wt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,st,It,wt.width,wt.height,0,Pt,gt,wt.data)}}}else{if(Y=M.mipmaps,zt&&re){Y.length>0&&nt++;const $=Nt(pt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,nt,It,$.width,$.height)}for(let $=0;$<6;$++)if(et){zt?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,pt[$].width,pt[$].height,Pt,gt,pt[$].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,It,pt[$].width,pt[$].height,0,Pt,gt,pt[$].data);for(let st=0;st<Y.length;st++){const Xt=Y[st].image[$].image;zt?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,st+1,0,0,Xt.width,Xt.height,Pt,gt,Xt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,st+1,It,Xt.width,Xt.height,0,Pt,gt,Xt.data)}}else{zt?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,Pt,gt,pt[$]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,It,Pt,gt,pt[$]);for(let st=0;st<Y.length;st++){const wt=Y[st];zt?D&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,st+1,0,0,Pt,gt,wt.image[$]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,st+1,It,Pt,gt,wt.image[$])}}}f(M)&&p(i.TEXTURE_CUBE_MAP),Z.__version=tt.version,M.onUpdate&&M.onUpdate(M)}R.__version=M.version}function j(R,M,k,J,tt,Z){const Tt=s.convert(k.format,k.colorSpace),ut=s.convert(k.type),mt=S(k.internalFormat,Tt,ut,k.colorSpace);if(!n.get(M).__hasExternalTextures){const et=Math.max(1,M.width>>Z),pt=Math.max(1,M.height>>Z);tt===i.TEXTURE_3D||tt===i.TEXTURE_2D_ARRAY?e.texImage3D(tt,Z,mt,et,pt,M.depth,0,Tt,ut,null):e.texImage2D(tt,Z,mt,et,pt,0,Tt,ut,null)}e.bindFramebuffer(i.FRAMEBUFFER,R),Et(M)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,tt,n.get(k).__webglTexture,0,Jt(M)):(tt===i.TEXTURE_2D||tt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&tt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,J,tt,n.get(k).__webglTexture,Z),e.bindFramebuffer(i.FRAMEBUFFER,null)}function ot(R,M,k){if(i.bindRenderbuffer(i.RENDERBUFFER,R),M.depthBuffer){const J=M.depthTexture,tt=J&&J.isDepthTexture?J.type:null,Z=v(M.stencilBuffer,tt),Tt=M.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ut=Jt(M);Et(M)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ut,Z,M.width,M.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,ut,Z,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,Z,M.width,M.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Tt,i.RENDERBUFFER,R)}else{const J=M.textures;for(let tt=0;tt<J.length;tt++){const Z=J[tt],Tt=s.convert(Z.format,Z.colorSpace),ut=s.convert(Z.type),mt=S(Z.internalFormat,Tt,ut,Z.colorSpace),Ft=Jt(M);k&&Et(M)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ft,mt,M.width,M.height):Et(M)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ft,mt,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,mt,M.width,M.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function at(R,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,R),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),H(M.depthTexture,0);const J=n.get(M.depthTexture).__webglTexture,tt=Jt(M);if(M.depthTexture.format===ji)Et(M)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0,tt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0);else if(M.depthTexture.format===rr)Et(M)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0,tt):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function yt(R){const M=n.get(R),k=R.isWebGLCubeRenderTarget===!0;if(R.depthTexture&&!M.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");at(M.__webglFramebuffer,R)}else if(k){M.__webglDepthbuffer=[];for(let J=0;J<6;J++)e.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer[J]),M.__webglDepthbuffer[J]=i.createRenderbuffer(),ot(M.__webglDepthbuffer[J],R,!1)}else e.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=i.createRenderbuffer(),ot(M.__webglDepthbuffer,R,!1);e.bindFramebuffer(i.FRAMEBUFFER,null)}function At(R,M,k){const J=n.get(R);M!==void 0&&j(J.__webglFramebuffer,R,R.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&yt(R)}function Mt(R){const M=R.texture,k=n.get(R),J=n.get(M);R.addEventListener("dispose",b);const tt=R.textures,Z=R.isWebGLCubeRenderTarget===!0,Tt=tt.length>1;if(Tt||(J.__webglTexture===void 0&&(J.__webglTexture=i.createTexture()),J.__version=M.version,a.memory.textures++),Z){k.__webglFramebuffer=[];for(let ut=0;ut<6;ut++)if(M.mipmaps&&M.mipmaps.length>0){k.__webglFramebuffer[ut]=[];for(let mt=0;mt<M.mipmaps.length;mt++)k.__webglFramebuffer[ut][mt]=i.createFramebuffer()}else k.__webglFramebuffer[ut]=i.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){k.__webglFramebuffer=[];for(let ut=0;ut<M.mipmaps.length;ut++)k.__webglFramebuffer[ut]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(Tt)for(let ut=0,mt=tt.length;ut<mt;ut++){const Ft=n.get(tt[ut]);Ft.__webglTexture===void 0&&(Ft.__webglTexture=i.createTexture(),a.memory.textures++)}if(R.samples>0&&Et(R)===!1){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let ut=0;ut<tt.length;ut++){const mt=tt[ut];k.__webglColorRenderbuffer[ut]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[ut]);const Ft=s.convert(mt.format,mt.colorSpace),et=s.convert(mt.type),pt=S(mt.internalFormat,Ft,et,mt.colorSpace,R.isXRRenderTarget===!0),Vt=Jt(R);i.renderbufferStorageMultisample(i.RENDERBUFFER,Vt,pt,R.width,R.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ut,i.RENDERBUFFER,k.__webglColorRenderbuffer[ut])}i.bindRenderbuffer(i.RENDERBUFFER,null),R.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),ot(k.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Z){e.bindTexture(i.TEXTURE_CUBE_MAP,J.__webglTexture),dt(i.TEXTURE_CUBE_MAP,M);for(let ut=0;ut<6;ut++)if(M.mipmaps&&M.mipmaps.length>0)for(let mt=0;mt<M.mipmaps.length;mt++)j(k.__webglFramebuffer[ut][mt],R,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,mt);else j(k.__webglFramebuffer[ut],R,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0);f(M)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Tt){for(let ut=0,mt=tt.length;ut<mt;ut++){const Ft=tt[ut],et=n.get(Ft);e.bindTexture(i.TEXTURE_2D,et.__webglTexture),dt(i.TEXTURE_2D,Ft),j(k.__webglFramebuffer,R,Ft,i.COLOR_ATTACHMENT0+ut,i.TEXTURE_2D,0),f(Ft)&&p(i.TEXTURE_2D)}e.unbindTexture()}else{let ut=i.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(ut=R.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ut,J.__webglTexture),dt(ut,M),M.mipmaps&&M.mipmaps.length>0)for(let mt=0;mt<M.mipmaps.length;mt++)j(k.__webglFramebuffer[mt],R,M,i.COLOR_ATTACHMENT0,ut,mt);else j(k.__webglFramebuffer,R,M,i.COLOR_ATTACHMENT0,ut,0);f(M)&&p(ut),e.unbindTexture()}R.depthBuffer&&yt(R)}function ne(R){const M=R.textures;for(let k=0,J=M.length;k<J;k++){const tt=M[k];if(f(tt)){const Z=R.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,Tt=n.get(tt).__webglTexture;e.bindTexture(Z,Tt),p(Z),e.unbindTexture()}}}const C=[],se=[];function qt(R){if(R.samples>0){if(Et(R)===!1){const M=R.textures,k=R.width,J=R.height;let tt=i.COLOR_BUFFER_BIT;const Z=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Tt=n.get(R),ut=M.length>1;if(ut)for(let mt=0;mt<M.length;mt++)e.bindFramebuffer(i.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Tt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Tt.__webglFramebuffer);for(let mt=0;mt<M.length;mt++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(tt|=i.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(tt|=i.STENCIL_BUFFER_BIT)),ut){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Tt.__webglColorRenderbuffer[mt]);const Ft=n.get(M[mt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ft,0)}i.blitFramebuffer(0,0,k,J,0,0,k,J,tt,i.NEAREST),l===!0&&(C.length=0,se.length=0,C.push(i.COLOR_ATTACHMENT0+mt),R.depthBuffer&&R.resolveDepthBuffer===!1&&(C.push(Z),se.push(Z),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,se)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,C))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ut)for(let mt=0;mt<M.length;mt++){e.bindFramebuffer(i.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,Tt.__webglColorRenderbuffer[mt]);const Ft=n.get(M[mt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Tt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,Ft,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&l){const M=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[M])}}}function Jt(R){return Math.min(r.maxSamples,R.samples)}function Et(R){const M=n.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function he(R){const M=a.render.frame;u.get(R)!==M&&(u.set(R,M),R.update())}function Dt(R,M){const k=R.colorSpace,J=R.format,tt=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||k!==ei&&k!==Yn&&(jt.getTransfer(k)===ee?(J!==on||tt!==Nn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),M}function Nt(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=z,this.resetTextureUnits=P,this.setTexture2D=H,this.setTexture2DArray=q,this.setTexture3D=V,this.setTextureCube=Q,this.rebindTextures=At,this.setupRenderTarget=Mt,this.updateRenderTargetMipmap=ne,this.updateMultisampleRenderTarget=qt,this.setupDepthRenderbuffer=yt,this.setupFrameBufferTexture=j,this.useMultisampledRTT=Et}function P_(i,t){function e(n,r=Yn){let s;const a=jt.getTransfer(r);if(n===Nn)return i.UNSIGNED_BYTE;if(n===tl)return i.UNSIGNED_SHORT_4_4_4_4;if(n===el)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Su)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===xu)return i.BYTE;if(n===Mu)return i.SHORT;if(n===Cr)return i.UNSIGNED_SHORT;if(n===Qo)return i.INT;if(n===Si)return i.UNSIGNED_INT;if(n===Dn)return i.FLOAT;if(n===Ur)return i.HALF_FLOAT;if(n===yu)return i.ALPHA;if(n===Eu)return i.RGB;if(n===on)return i.RGBA;if(n===Tu)return i.LUMINANCE;if(n===bu)return i.LUMINANCE_ALPHA;if(n===ji)return i.DEPTH_COMPONENT;if(n===rr)return i.DEPTH_STENCIL;if(n===Au)return i.RED;if(n===nl)return i.RED_INTEGER;if(n===wu)return i.RG;if(n===il)return i.RG_INTEGER;if(n===rl)return i.RGBA_INTEGER;if(n===Ls||n===Ds||n===Is||n===Us)if(a===ee)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===Ls)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ds)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Is)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Us)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===Ls)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ds)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Is)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Us)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ho||n===fo||n===po||n===mo)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===ho)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===fo)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===po)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===mo)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===go||n===_o||n===vo)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===go||n===_o)return a===ee?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===vo)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===xo||n===Mo||n===So||n===yo||n===Eo||n===To||n===bo||n===Ao||n===wo||n===Ro||n===Co||n===Po||n===Lo||n===Do)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===xo)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Mo)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===So)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===yo)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Eo)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===To)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===bo)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ao)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===wo)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Ro)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Co)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Po)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Lo)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Do)return a===ee?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ns||n===Io||n===Uo)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===Ns)return a===ee?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Io)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Uo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ru||n===No||n===Fo||n===Oo)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===Ns)return s.COMPRESSED_RED_RGTC1_EXT;if(n===No)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Fo)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Oo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ir?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class L_ extends qe{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class xi extends Re{constructor(){super(),this.isGroup=!0,this.type="Group"}}const D_={type:"move"};class Ya{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new xi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new xi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new N,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new N),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new xi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new N,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new N),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const _ of t.hand.values()){const f=e.getJointPose(_,n),p=this._getHandJoint(c,_);f!==null&&(p.matrix.fromArray(f.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=f.radius),p.visible=f!==null}const u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],h=u.position.distanceTo(d.position),m=.02,g=.005;c.inputState.pinching&&h>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=e.getPose(t.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(D_)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new xi;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const I_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,U_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class N_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const r=new Ie,s=t.properties.get(r);s.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=r}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new ti({vertexShader:I_,fragmentShader:U_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Fe(new Br(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class F_ extends or{constructor(t,e){super();const n=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,u=null,d=null,h=null,m=null,g=null;const _=new N_,f=e.getContextAttributes();let p=null,S=null;const v=[],E=[],w=new kt;let b=null;const A=new qe;A.layers.enable(1),A.viewport=new xe;const L=new qe;L.layers.enable(2),L.viewport=new xe;const T=[A,L],x=new L_;x.layers.enable(1),x.layers.enable(2);let P=null,z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let j=v[W];return j===void 0&&(j=new Ya,v[W]=j),j.getTargetRaySpace()},this.getControllerGrip=function(W){let j=v[W];return j===void 0&&(j=new Ya,v[W]=j),j.getGripSpace()},this.getHand=function(W){let j=v[W];return j===void 0&&(j=new Ya,v[W]=j),j.getHandSpace()};function F(W){const j=E.indexOf(W.inputSource);if(j===-1)return;const ot=v[j];ot!==void 0&&(ot.update(W.inputSource,W.frame,c||a),ot.dispatchEvent({type:W.type,data:W.inputSource}))}function H(){r.removeEventListener("select",F),r.removeEventListener("selectstart",F),r.removeEventListener("selectend",F),r.removeEventListener("squeeze",F),r.removeEventListener("squeezestart",F),r.removeEventListener("squeezeend",F),r.removeEventListener("end",H),r.removeEventListener("inputsourceschange",q);for(let W=0;W<v.length;W++){const j=E[W];j!==null&&(E[W]=null,v[W].disconnect(j))}P=null,z=null,_.reset(),t.setRenderTarget(p),m=null,h=null,d=null,r=null,S=null,Ht.stop(),n.isPresenting=!1,t.setPixelRatio(b),t.setSize(w.width,w.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){s=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){o=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(W){c=W},this.getBaseLayer=function(){return h!==null?h:m},this.getBinding=function(){return d},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(W){if(r=W,r!==null){if(p=t.getRenderTarget(),r.addEventListener("select",F),r.addEventListener("selectstart",F),r.addEventListener("selectend",F),r.addEventListener("squeeze",F),r.addEventListener("squeezestart",F),r.addEventListener("squeezeend",F),r.addEventListener("end",H),r.addEventListener("inputsourceschange",q),f.xrCompatible!==!0&&await e.makeXRCompatible(),b=t.getPixelRatio(),t.getSize(w),r.renderState.layers===void 0){const j={antialias:f.antialias,alpha:!0,depth:f.depth,stencil:f.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(r,e,j),r.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),S=new yi(m.framebufferWidth,m.framebufferHeight,{format:on,type:Nn,colorSpace:t.outputColorSpace,stencilBuffer:f.stencil})}else{let j=null,ot=null,at=null;f.depth&&(at=f.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,j=f.stencil?rr:ji,ot=f.stencil?ir:Si);const yt={colorFormat:e.RGBA8,depthFormat:at,scaleFactor:s};d=new XRWebGLBinding(r,e),h=d.createProjectionLayer(yt),r.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),S=new yi(h.textureWidth,h.textureHeight,{format:on,type:Nn,depthTexture:new Gu(h.textureWidth,h.textureHeight,ot,void 0,void 0,void 0,void 0,void 0,void 0,j),stencilBuffer:f.stencil,colorSpace:t.outputColorSpace,samples:f.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),Ht.setContext(r),Ht.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function q(W){for(let j=0;j<W.removed.length;j++){const ot=W.removed[j],at=E.indexOf(ot);at>=0&&(E[at]=null,v[at].disconnect(ot))}for(let j=0;j<W.added.length;j++){const ot=W.added[j];let at=E.indexOf(ot);if(at===-1){for(let At=0;At<v.length;At++)if(At>=E.length){E.push(ot),at=At;break}else if(E[At]===null){E[At]=ot,at=At;break}if(at===-1)break}const yt=v[at];yt&&yt.connect(ot)}}const V=new N,Q=new N;function G(W,j,ot){V.setFromMatrixPosition(j.matrixWorld),Q.setFromMatrixPosition(ot.matrixWorld);const at=V.distanceTo(Q),yt=j.projectionMatrix.elements,At=ot.projectionMatrix.elements,Mt=yt[14]/(yt[10]-1),ne=yt[14]/(yt[10]+1),C=(yt[9]+1)/yt[5],se=(yt[9]-1)/yt[5],qt=(yt[8]-1)/yt[0],Jt=(At[8]+1)/At[0],Et=Mt*qt,he=Mt*Jt,Dt=at/(-qt+Jt),Nt=Dt*-qt;j.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(Nt),W.translateZ(Dt),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert();const R=Mt+Dt,M=ne+Dt,k=Et-Nt,J=he+(at-Nt),tt=C*ne/M*R,Z=se*ne/M*R;W.projectionMatrix.makePerspective(k,J,tt,Z,R,M),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}function ht(W,j){j===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(j.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(r===null)return;_.texture!==null&&(W.near=_.depthNear,W.far=_.depthFar),x.near=L.near=A.near=W.near,x.far=L.far=A.far=W.far,(P!==x.near||z!==x.far)&&(r.updateRenderState({depthNear:x.near,depthFar:x.far}),P=x.near,z=x.far,A.near=P,A.far=z,L.near=P,L.far=z,A.updateProjectionMatrix(),L.updateProjectionMatrix(),W.updateProjectionMatrix());const j=W.parent,ot=x.cameras;ht(x,j);for(let at=0;at<ot.length;at++)ht(ot[at],j);ot.length===2?G(x,A,L):x.projectionMatrix.copy(A.projectionMatrix),ct(W,x,j)};function ct(W,j,ot){ot===null?W.matrix.copy(j.matrixWorld):(W.matrix.copy(ot.matrixWorld),W.matrix.invert(),W.matrix.multiply(j.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(j.projectionMatrix),W.projectionMatrixInverse.copy(j.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=zo*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(h===null&&m===null))return l},this.setFoveation=function(W){l=W,h!==null&&(h.fixedFoveation=W),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=W)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(x)};let dt=null;function Ut(W,j){if(u=j.getViewerPose(c||a),g=j,u!==null){const ot=u.views;m!==null&&(t.setRenderTargetFramebuffer(S,m.framebuffer),t.setRenderTarget(S));let at=!1;ot.length!==x.cameras.length&&(x.cameras.length=0,at=!0);for(let At=0;At<ot.length;At++){const Mt=ot[At];let ne=null;if(m!==null)ne=m.getViewport(Mt);else{const se=d.getViewSubImage(h,Mt);ne=se.viewport,At===0&&(t.setRenderTargetTextures(S,se.colorTexture,h.ignoreDepthValues?void 0:se.depthStencilTexture),t.setRenderTarget(S))}let C=T[At];C===void 0&&(C=new qe,C.layers.enable(At),C.viewport=new xe,T[At]=C),C.matrix.fromArray(Mt.transform.matrix),C.matrix.decompose(C.position,C.quaternion,C.scale),C.projectionMatrix.fromArray(Mt.projectionMatrix),C.projectionMatrixInverse.copy(C.projectionMatrix).invert(),C.viewport.set(ne.x,ne.y,ne.width,ne.height),At===0&&(x.matrix.copy(C.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),at===!0&&x.cameras.push(C)}const yt=r.enabledFeatures;if(yt&&yt.includes("depth-sensing")){const At=d.getDepthInformation(ot[0]);At&&At.isValid&&At.texture&&_.init(t,At,r.renderState)}}for(let ot=0;ot<v.length;ot++){const at=E[ot],yt=v[ot];at!==null&&yt!==void 0&&yt.update(at,j,c||a)}dt&&dt(W,j),j.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:j}),g=null}const Ht=new Hu;Ht.setAnimationLoop(Ut),this.setAnimationLoop=function(W){dt=W},this.dispose=function(){}}}const ci=new Fn,O_=new ce;function B_(i,t){function e(f,p){f.matrixAutoUpdate===!0&&f.updateMatrix(),p.value.copy(f.matrix)}function n(f,p){p.color.getRGB(f.fogColor.value,Ou(i)),p.isFog?(f.fogNear.value=p.near,f.fogFar.value=p.far):p.isFogExp2&&(f.fogDensity.value=p.density)}function r(f,p,S,v,E){p.isMeshBasicMaterial||p.isMeshLambertMaterial?s(f,p):p.isMeshToonMaterial?(s(f,p),d(f,p)):p.isMeshPhongMaterial?(s(f,p),u(f,p)):p.isMeshStandardMaterial?(s(f,p),h(f,p),p.isMeshPhysicalMaterial&&m(f,p,E)):p.isMeshMatcapMaterial?(s(f,p),g(f,p)):p.isMeshDepthMaterial?s(f,p):p.isMeshDistanceMaterial?(s(f,p),_(f,p)):p.isMeshNormalMaterial?s(f,p):p.isLineBasicMaterial?(a(f,p),p.isLineDashedMaterial&&o(f,p)):p.isPointsMaterial?l(f,p,S,v):p.isSpriteMaterial?c(f,p):p.isShadowMaterial?(f.color.value.copy(p.color),f.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(f,p){f.opacity.value=p.opacity,p.color&&f.diffuse.value.copy(p.color),p.emissive&&f.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(f.map.value=p.map,e(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,e(p.alphaMap,f.alphaMapTransform)),p.bumpMap&&(f.bumpMap.value=p.bumpMap,e(p.bumpMap,f.bumpMapTransform),f.bumpScale.value=p.bumpScale,p.side===De&&(f.bumpScale.value*=-1)),p.normalMap&&(f.normalMap.value=p.normalMap,e(p.normalMap,f.normalMapTransform),f.normalScale.value.copy(p.normalScale),p.side===De&&f.normalScale.value.negate()),p.displacementMap&&(f.displacementMap.value=p.displacementMap,e(p.displacementMap,f.displacementMapTransform),f.displacementScale.value=p.displacementScale,f.displacementBias.value=p.displacementBias),p.emissiveMap&&(f.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,f.emissiveMapTransform)),p.specularMap&&(f.specularMap.value=p.specularMap,e(p.specularMap,f.specularMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest);const S=t.get(p),v=S.envMap,E=S.envMapRotation;v&&(f.envMap.value=v,ci.copy(E),ci.x*=-1,ci.y*=-1,ci.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(ci.y*=-1,ci.z*=-1),f.envMapRotation.value.setFromMatrix4(O_.makeRotationFromEuler(ci)),f.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=p.reflectivity,f.ior.value=p.ior,f.refractionRatio.value=p.refractionRatio),p.lightMap&&(f.lightMap.value=p.lightMap,f.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,f.lightMapTransform)),p.aoMap&&(f.aoMap.value=p.aoMap,f.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,f.aoMapTransform))}function a(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,p.map&&(f.map.value=p.map,e(p.map,f.mapTransform))}function o(f,p){f.dashSize.value=p.dashSize,f.totalSize.value=p.dashSize+p.gapSize,f.scale.value=p.scale}function l(f,p,S,v){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.size.value=p.size*S,f.scale.value=v*.5,p.map&&(f.map.value=p.map,e(p.map,f.uvTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,e(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function c(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.rotation.value=p.rotation,p.map&&(f.map.value=p.map,e(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,e(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function u(f,p){f.specular.value.copy(p.specular),f.shininess.value=Math.max(p.shininess,1e-4)}function d(f,p){p.gradientMap&&(f.gradientMap.value=p.gradientMap)}function h(f,p){f.metalness.value=p.metalness,p.metalnessMap&&(f.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,f.metalnessMapTransform)),f.roughness.value=p.roughness,p.roughnessMap&&(f.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,f.roughnessMapTransform)),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)}function m(f,p,S){f.ior.value=p.ior,p.sheen>0&&(f.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),f.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(f.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,f.sheenColorMapTransform)),p.sheenRoughnessMap&&(f.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,f.sheenRoughnessMapTransform))),p.clearcoat>0&&(f.clearcoat.value=p.clearcoat,f.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(f.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,f.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(f.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===De&&f.clearcoatNormalScale.value.negate())),p.dispersion>0&&(f.dispersion.value=p.dispersion),p.iridescence>0&&(f.iridescence.value=p.iridescence,f.iridescenceIOR.value=p.iridescenceIOR,f.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(f.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,f.iridescenceMapTransform)),p.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),p.transmission>0&&(f.transmission.value=p.transmission,f.transmissionSamplerMap.value=S.texture,f.transmissionSamplerSize.value.set(S.width,S.height),p.transmissionMap&&(f.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,f.transmissionMapTransform)),f.thickness.value=p.thickness,p.thicknessMap&&(f.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=p.attenuationDistance,f.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(f.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(f.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=p.specularIntensity,f.specularColor.value.copy(p.specularColor),p.specularColorMap&&(f.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,f.specularColorMapTransform)),p.specularIntensityMap&&(f.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,f.specularIntensityMapTransform))}function g(f,p){p.matcap&&(f.matcap.value=p.matcap)}function _(f,p){const S=t.get(p).light;f.referencePosition.value.setFromMatrixPosition(S.matrixWorld),f.nearDistance.value=S.shadow.camera.near,f.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function z_(i,t,e,n){let r={},s={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(S,v){const E=v.program;n.uniformBlockBinding(S,E)}function c(S,v){let E=r[S.id];E===void 0&&(g(S),E=u(S),r[S.id]=E,S.addEventListener("dispose",f));const w=v.program;n.updateUBOMapping(S,w);const b=t.render.frame;s[S.id]!==b&&(h(S),s[S.id]=b)}function u(S){const v=d();S.__bindingPointIndex=v;const E=i.createBuffer(),w=S.__size,b=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,w,b),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,v,E),E}function d(){for(let S=0;S<o;S++)if(a.indexOf(S)===-1)return a.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(S){const v=r[S.id],E=S.uniforms,w=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,v);for(let b=0,A=E.length;b<A;b++){const L=Array.isArray(E[b])?E[b]:[E[b]];for(let T=0,x=L.length;T<x;T++){const P=L[T];if(m(P,b,T,w)===!0){const z=P.__offset,F=Array.isArray(P.value)?P.value:[P.value];let H=0;for(let q=0;q<F.length;q++){const V=F[q],Q=_(V);typeof V=="number"||typeof V=="boolean"?(P.__data[0]=V,i.bufferSubData(i.UNIFORM_BUFFER,z+H,P.__data)):V.isMatrix3?(P.__data[0]=V.elements[0],P.__data[1]=V.elements[1],P.__data[2]=V.elements[2],P.__data[3]=0,P.__data[4]=V.elements[3],P.__data[5]=V.elements[4],P.__data[6]=V.elements[5],P.__data[7]=0,P.__data[8]=V.elements[6],P.__data[9]=V.elements[7],P.__data[10]=V.elements[8],P.__data[11]=0):(V.toArray(P.__data,H),H+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,z,P.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(S,v,E,w){const b=S.value,A=v+"_"+E;if(w[A]===void 0)return typeof b=="number"||typeof b=="boolean"?w[A]=b:w[A]=b.clone(),!0;{const L=w[A];if(typeof b=="number"||typeof b=="boolean"){if(L!==b)return w[A]=b,!0}else if(L.equals(b)===!1)return L.copy(b),!0}return!1}function g(S){const v=S.uniforms;let E=0;const w=16;for(let A=0,L=v.length;A<L;A++){const T=Array.isArray(v[A])?v[A]:[v[A]];for(let x=0,P=T.length;x<P;x++){const z=T[x],F=Array.isArray(z.value)?z.value:[z.value];for(let H=0,q=F.length;H<q;H++){const V=F[H],Q=_(V),G=E%w;G!==0&&w-G<Q.boundary&&(E+=w-G),z.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),z.__offset=E,E+=Q.storage}}}const b=E%w;return b>0&&(E+=w-b),S.__size=E,S.__cache={},this}function _(S){const v={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(v.boundary=4,v.storage=4):S.isVector2?(v.boundary=8,v.storage=8):S.isVector3||S.isColor?(v.boundary=16,v.storage=12):S.isVector4?(v.boundary=16,v.storage=16):S.isMatrix3?(v.boundary=48,v.storage=48):S.isMatrix4?(v.boundary=64,v.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),v}function f(S){const v=S.target;v.removeEventListener("dispose",f);const E=a.indexOf(v.__bindingPointIndex);a.splice(E,1),i.deleteBuffer(r[v.id]),delete r[v.id],delete s[v.id]}function p(){for(const S in r)i.deleteBuffer(r[S]);a=[],r={},s={}}return{bind:l,update:c,dispose:p}}class k_{constructor(t={}){const{canvas:e=Cd(),context:n=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1}=t;this.isWebGLRenderer=!0;let h;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");h=n.getContextAttributes().alpha}else h=a;const m=new Uint32Array(4),g=new Int32Array(4);let _=null,f=null;const p=[],S=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=mn,this.toneMapping=jn,this.toneMappingExposure=1;const v=this;let E=!1,w=0,b=0,A=null,L=-1,T=null;const x=new xe,P=new xe;let z=null;const F=new Gt(0);let H=0,q=e.width,V=e.height,Q=1,G=null,ht=null;const ct=new xe(0,0,q,V),dt=new xe(0,0,q,V);let Ut=!1;const Ht=new ku;let W=!1,j=!1;const ot=new ce,at=new N,yt=new xe,At={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Mt=!1;function ne(){return A===null?Q:1}let C=n;function se(y,I){return e.getContext(y,I)}try{const y={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Jo}`),e.addEventListener("webglcontextlost",Y,!1),e.addEventListener("webglcontextrestored",$,!1),e.addEventListener("webglcontextcreationerror",st,!1),C===null){const I="webgl2";if(C=se(I,y),C===null)throw se(I)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(y){throw console.error("THREE.WebGLRenderer: "+y.message),y}let qt,Jt,Et,he,Dt,Nt,R,M,k,J,tt,Z,Tt,ut,mt,Ft,et,pt,Vt,Pt,gt,It,zt,re;function D(){qt=new Ym(C),qt.init(),It=new P_(C,qt),Jt=new km(C,qt,t,It),Et=new w_(C),he=new Zm(C),Dt=new f_,Nt=new C_(C,qt,Et,Dt,Jt,It,he),R=new Gm(v),M=new qm(v),k=new ef(C),zt=new Bm(C,k),J=new $m(C,k,he,zt),tt=new Jm(C,J,k,he),Vt=new jm(C,Jt,Nt),Ft=new Hm(Dt),Z=new d_(v,R,M,qt,Jt,zt,Ft),Tt=new B_(v,Dt),ut=new m_,mt=new S_(qt),pt=new Om(v,R,M,Et,tt,h,l),et=new A_(v,tt,Jt),re=new z_(C,he,Jt,Et),Pt=new zm(C,qt,he),gt=new Km(C,qt,he),he.programs=Z.programs,v.capabilities=Jt,v.extensions=qt,v.properties=Dt,v.renderLists=ut,v.shadowMap=et,v.state=Et,v.info=he}D();const nt=new F_(v,C);this.xr=nt,this.getContext=function(){return C},this.getContextAttributes=function(){return C.getContextAttributes()},this.forceContextLoss=function(){const y=qt.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=qt.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return Q},this.setPixelRatio=function(y){y!==void 0&&(Q=y,this.setSize(q,V,!1))},this.getSize=function(y){return y.set(q,V)},this.setSize=function(y,I,O=!0){if(nt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}q=y,V=I,e.width=Math.floor(y*Q),e.height=Math.floor(I*Q),O===!0&&(e.style.width=y+"px",e.style.height=I+"px"),this.setViewport(0,0,y,I)},this.getDrawingBufferSize=function(y){return y.set(q*Q,V*Q).floor()},this.setDrawingBufferSize=function(y,I,O){q=y,V=I,Q=O,e.width=Math.floor(y*O),e.height=Math.floor(I*O),this.setViewport(0,0,y,I)},this.getCurrentViewport=function(y){return y.copy(x)},this.getViewport=function(y){return y.copy(ct)},this.setViewport=function(y,I,O,B){y.isVector4?ct.set(y.x,y.y,y.z,y.w):ct.set(y,I,O,B),Et.viewport(x.copy(ct).multiplyScalar(Q).round())},this.getScissor=function(y){return y.copy(dt)},this.setScissor=function(y,I,O,B){y.isVector4?dt.set(y.x,y.y,y.z,y.w):dt.set(y,I,O,B),Et.scissor(P.copy(dt).multiplyScalar(Q).round())},this.getScissorTest=function(){return Ut},this.setScissorTest=function(y){Et.setScissorTest(Ut=y)},this.setOpaqueSort=function(y){G=y},this.setTransparentSort=function(y){ht=y},this.getClearColor=function(y){return y.copy(pt.getClearColor())},this.setClearColor=function(){pt.setClearColor.apply(pt,arguments)},this.getClearAlpha=function(){return pt.getClearAlpha()},this.setClearAlpha=function(){pt.setClearAlpha.apply(pt,arguments)},this.clear=function(y=!0,I=!0,O=!0){let B=0;if(y){let U=!1;if(A!==null){const it=A.texture.format;U=it===rl||it===il||it===nl}if(U){const it=A.texture.type,ft=it===Nn||it===Si||it===Cr||it===ir||it===tl||it===el,_t=pt.getClearColor(),vt=pt.getClearAlpha(),Rt=_t.r,Ct=_t.g,bt=_t.b;ft?(m[0]=Rt,m[1]=Ct,m[2]=bt,m[3]=vt,C.clearBufferuiv(C.COLOR,0,m)):(g[0]=Rt,g[1]=Ct,g[2]=bt,g[3]=vt,C.clearBufferiv(C.COLOR,0,g))}else B|=C.COLOR_BUFFER_BIT}I&&(B|=C.DEPTH_BUFFER_BIT),O&&(B|=C.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),C.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Y,!1),e.removeEventListener("webglcontextrestored",$,!1),e.removeEventListener("webglcontextcreationerror",st,!1),ut.dispose(),mt.dispose(),Dt.dispose(),R.dispose(),M.dispose(),tt.dispose(),zt.dispose(),re.dispose(),Z.dispose(),nt.dispose(),nt.removeEventListener("sessionstart",dn),nt.removeEventListener("sessionend",El),ii.stop()};function Y(y){y.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),E=!0}function $(){console.log("THREE.WebGLRenderer: Context Restored."),E=!1;const y=he.autoReset,I=et.enabled,O=et.autoUpdate,B=et.needsUpdate,U=et.type;D(),he.autoReset=y,et.enabled=I,et.autoUpdate=O,et.needsUpdate=B,et.type=U}function st(y){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function wt(y){const I=y.target;I.removeEventListener("dispose",wt),Xt(I)}function Xt(y){de(y),Dt.remove(y)}function de(y){const I=Dt.get(y).programs;I!==void 0&&(I.forEach(function(O){Z.releaseProgram(O)}),y.isShaderMaterial&&Z.releaseShaderCache(y))}this.renderBufferDirect=function(y,I,O,B,U,it){I===null&&(I=At);const ft=U.isMesh&&U.matrixWorld.determinant()<0,_t=wh(y,I,O,B,U);Et.setMaterial(B,ft);let vt=O.index,Rt=1;if(B.wireframe===!0){if(vt=J.getWireframeAttribute(O),vt===void 0)return;Rt=2}const Ct=O.drawRange,bt=O.attributes.position;let $t=Ct.start*Rt,ae=(Ct.start+Ct.count)*Rt;it!==null&&($t=Math.max($t,it.start*Rt),ae=Math.min(ae,(it.start+it.count)*Rt)),vt!==null?($t=Math.max($t,0),ae=Math.min(ae,vt.count)):bt!=null&&($t=Math.max($t,0),ae=Math.min(ae,bt.count));const oe=ae-$t;if(oe<0||oe===1/0)return;zt.setup(U,B,_t,O,vt);let Be,Kt=Pt;if(vt!==null&&(Be=k.get(vt),Kt=gt,Kt.setIndex(Be)),U.isMesh)B.wireframe===!0?(Et.setLineWidth(B.wireframeLinewidth*ne()),Kt.setMode(C.LINES)):Kt.setMode(C.TRIANGLES);else if(U.isLine){let St=B.linewidth;St===void 0&&(St=1),Et.setLineWidth(St*ne()),U.isLineSegments?Kt.setMode(C.LINES):U.isLineLoop?Kt.setMode(C.LINE_LOOP):Kt.setMode(C.LINE_STRIP)}else U.isPoints?Kt.setMode(C.POINTS):U.isSprite&&Kt.setMode(C.TRIANGLES);if(U.isBatchedMesh)if(U._multiDrawInstances!==null)Kt.renderMultiDrawInstances(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount,U._multiDrawInstances);else if(qt.get("WEBGL_multi_draw"))Kt.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{const St=U._multiDrawStarts,ye=U._multiDrawCounts,Zt=U._multiDrawCount,Ze=vt?k.get(vt).bytesPerElement:1,bi=Dt.get(B).currentProgram.getUniforms();for(let ze=0;ze<Zt;ze++)bi.setValue(C,"_gl_DrawID",ze),Kt.render(St[ze]/Ze,ye[ze])}else if(U.isInstancedMesh)Kt.renderInstances($t,oe,U.count);else if(O.isInstancedBufferGeometry){const St=O._maxInstanceCount!==void 0?O._maxInstanceCount:1/0,ye=Math.min(O.instanceCount,St);Kt.renderInstances($t,oe,ye)}else Kt.render($t,oe)};function Se(y,I,O){y.transparent===!0&&y.side===sn&&y.forceSinglePass===!1?(y.side=De,y.needsUpdate=!0,qr(y,I,O),y.side=Qn,y.needsUpdate=!0,qr(y,I,O),y.side=sn):qr(y,I,O)}this.compile=function(y,I,O=null){O===null&&(O=y),f=mt.get(O),f.init(I),S.push(f),O.traverseVisible(function(U){U.isLight&&U.layers.test(I.layers)&&(f.pushLight(U),U.castShadow&&f.pushShadow(U))}),y!==O&&y.traverseVisible(function(U){U.isLight&&U.layers.test(I.layers)&&(f.pushLight(U),U.castShadow&&f.pushShadow(U))}),f.setupLights();const B=new Set;return y.traverse(function(U){const it=U.material;if(it)if(Array.isArray(it))for(let ft=0;ft<it.length;ft++){const _t=it[ft];Se(_t,O,U),B.add(_t)}else Se(it,O,U),B.add(it)}),S.pop(),f=null,B},this.compileAsync=function(y,I,O=null){const B=this.compile(y,I,O);return new Promise(U=>{function it(){if(B.forEach(function(ft){Dt.get(ft).currentProgram.isReady()&&B.delete(ft)}),B.size===0){U(y);return}setTimeout(it,10)}qt.get("KHR_parallel_shader_compile")!==null?it():setTimeout(it,10)})};let Yt=null;function Sn(y){Yt&&Yt(y)}function dn(){ii.stop()}function El(){ii.start()}const ii=new Hu;ii.setAnimationLoop(Sn),typeof self<"u"&&ii.setContext(self),this.setAnimationLoop=function(y){Yt=y,nt.setAnimationLoop(y),y===null?ii.stop():ii.start()},nt.addEventListener("sessionstart",dn),nt.addEventListener("sessionend",El),this.render=function(y,I){if(I!==void 0&&I.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(E===!0)return;if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),nt.enabled===!0&&nt.isPresenting===!0&&(nt.cameraAutoUpdate===!0&&nt.updateCamera(I),I=nt.getCamera()),y.isScene===!0&&y.onBeforeRender(v,y,I,A),f=mt.get(y,S.length),f.init(I),S.push(f),ot.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),Ht.setFromProjectionMatrix(ot),j=this.localClippingEnabled,W=Ft.init(this.clippingPlanes,j),_=ut.get(y,p.length),_.init(),p.push(_),nt.enabled===!0&&nt.isPresenting===!0){const it=v.xr.getDepthSensingMesh();it!==null&&_a(it,I,-1/0,v.sortObjects)}_a(y,I,0,v.sortObjects),_.finish(),v.sortObjects===!0&&_.sort(G,ht),Mt=nt.enabled===!1||nt.isPresenting===!1||nt.hasDepthSensing()===!1,Mt&&pt.addToRenderList(_,y),this.info.render.frame++,W===!0&&Ft.beginShadows();const O=f.state.shadowsArray;et.render(O,y,I),W===!0&&Ft.endShadows(),this.info.autoReset===!0&&this.info.reset();const B=_.opaque,U=_.transmissive;if(f.setupLights(),I.isArrayCamera){const it=I.cameras;if(U.length>0)for(let ft=0,_t=it.length;ft<_t;ft++){const vt=it[ft];bl(B,U,y,vt)}Mt&&pt.render(y);for(let ft=0,_t=it.length;ft<_t;ft++){const vt=it[ft];Tl(_,y,vt,vt.viewport)}}else U.length>0&&bl(B,U,y,I),Mt&&pt.render(y),Tl(_,y,I);A!==null&&(Nt.updateMultisampleRenderTarget(A),Nt.updateRenderTargetMipmap(A)),y.isScene===!0&&y.onAfterRender(v,y,I),zt.resetDefaultState(),L=-1,T=null,S.pop(),S.length>0?(f=S[S.length-1],W===!0&&Ft.setGlobalState(v.clippingPlanes,f.state.camera)):f=null,p.pop(),p.length>0?_=p[p.length-1]:_=null};function _a(y,I,O,B){if(y.visible===!1)return;if(y.layers.test(I.layers)){if(y.isGroup)O=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(I);else if(y.isLight)f.pushLight(y),y.castShadow&&f.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||Ht.intersectsSprite(y)){B&&yt.setFromMatrixPosition(y.matrixWorld).applyMatrix4(ot);const ft=tt.update(y),_t=y.material;_t.visible&&_.push(y,ft,_t,O,yt.z,null)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||Ht.intersectsObject(y))){const ft=tt.update(y),_t=y.material;if(B&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),yt.copy(y.boundingSphere.center)):(ft.boundingSphere===null&&ft.computeBoundingSphere(),yt.copy(ft.boundingSphere.center)),yt.applyMatrix4(y.matrixWorld).applyMatrix4(ot)),Array.isArray(_t)){const vt=ft.groups;for(let Rt=0,Ct=vt.length;Rt<Ct;Rt++){const bt=vt[Rt],$t=_t[bt.materialIndex];$t&&$t.visible&&_.push(y,ft,$t,O,yt.z,bt)}}else _t.visible&&_.push(y,ft,_t,O,yt.z,null)}}const it=y.children;for(let ft=0,_t=it.length;ft<_t;ft++)_a(it[ft],I,O,B)}function Tl(y,I,O,B){const U=y.opaque,it=y.transmissive,ft=y.transparent;f.setupLightsView(O),W===!0&&Ft.setGlobalState(v.clippingPlanes,O),B&&Et.viewport(x.copy(B)),U.length>0&&Xr(U,I,O),it.length>0&&Xr(it,I,O),ft.length>0&&Xr(ft,I,O),Et.buffers.depth.setTest(!0),Et.buffers.depth.setMask(!0),Et.buffers.color.setMask(!0),Et.setPolygonOffset(!1)}function bl(y,I,O,B){if((O.isScene===!0?O.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[B.id]===void 0&&(f.state.transmissionRenderTarget[B.id]=new yi(1,1,{generateMipmaps:!0,type:qt.has("EXT_color_buffer_half_float")||qt.has("EXT_color_buffer_float")?Ur:Nn,minFilter:vi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:jt.workingColorSpace}));const it=f.state.transmissionRenderTarget[B.id],ft=B.viewport||x;it.setSize(ft.z,ft.w);const _t=v.getRenderTarget();v.setRenderTarget(it),v.getClearColor(F),H=v.getClearAlpha(),H<1&&v.setClearColor(16777215,.5),Mt?pt.render(O):v.clear();const vt=v.toneMapping;v.toneMapping=jn;const Rt=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),f.setupLightsView(B),W===!0&&Ft.setGlobalState(v.clippingPlanes,B),Xr(y,O,B),Nt.updateMultisampleRenderTarget(it),Nt.updateRenderTargetMipmap(it),qt.has("WEBGL_multisampled_render_to_texture")===!1){let Ct=!1;for(let bt=0,$t=I.length;bt<$t;bt++){const ae=I[bt],oe=ae.object,Be=ae.geometry,Kt=ae.material,St=ae.group;if(Kt.side===sn&&oe.layers.test(B.layers)){const ye=Kt.side;Kt.side=De,Kt.needsUpdate=!0,Al(oe,O,B,Be,Kt,St),Kt.side=ye,Kt.needsUpdate=!0,Ct=!0}}Ct===!0&&(Nt.updateMultisampleRenderTarget(it),Nt.updateRenderTargetMipmap(it))}v.setRenderTarget(_t),v.setClearColor(F,H),Rt!==void 0&&(B.viewport=Rt),v.toneMapping=vt}function Xr(y,I,O){const B=I.isScene===!0?I.overrideMaterial:null;for(let U=0,it=y.length;U<it;U++){const ft=y[U],_t=ft.object,vt=ft.geometry,Rt=B===null?ft.material:B,Ct=ft.group;_t.layers.test(O.layers)&&Al(_t,I,O,vt,Rt,Ct)}}function Al(y,I,O,B,U,it){y.onBeforeRender(v,I,O,B,U,it),y.modelViewMatrix.multiplyMatrices(O.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),U.transparent===!0&&U.side===sn&&U.forceSinglePass===!1?(U.side=De,U.needsUpdate=!0,v.renderBufferDirect(O,I,B,U,y,it),U.side=Qn,U.needsUpdate=!0,v.renderBufferDirect(O,I,B,U,y,it),U.side=sn):v.renderBufferDirect(O,I,B,U,y,it),y.onAfterRender(v,I,O,B,U,it)}function qr(y,I,O){I.isScene!==!0&&(I=At);const B=Dt.get(y),U=f.state.lights,it=f.state.shadowsArray,ft=U.state.version,_t=Z.getParameters(y,U.state,it,I,O),vt=Z.getProgramCacheKey(_t);let Rt=B.programs;B.environment=y.isMeshStandardMaterial?I.environment:null,B.fog=I.fog,B.envMap=(y.isMeshStandardMaterial?M:R).get(y.envMap||B.environment),B.envMapRotation=B.environment!==null&&y.envMap===null?I.environmentRotation:y.envMapRotation,Rt===void 0&&(y.addEventListener("dispose",wt),Rt=new Map,B.programs=Rt);let Ct=Rt.get(vt);if(Ct!==void 0){if(B.currentProgram===Ct&&B.lightsStateVersion===ft)return Rl(y,_t),Ct}else _t.uniforms=Z.getUniforms(y),y.onBeforeCompile(_t,v),Ct=Z.acquireProgram(_t,vt),Rt.set(vt,Ct),B.uniforms=_t.uniforms;const bt=B.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(bt.clippingPlanes=Ft.uniform),Rl(y,_t),B.needsLights=Ch(y),B.lightsStateVersion=ft,B.needsLights&&(bt.ambientLightColor.value=U.state.ambient,bt.lightProbe.value=U.state.probe,bt.directionalLights.value=U.state.directional,bt.directionalLightShadows.value=U.state.directionalShadow,bt.spotLights.value=U.state.spot,bt.spotLightShadows.value=U.state.spotShadow,bt.rectAreaLights.value=U.state.rectArea,bt.ltc_1.value=U.state.rectAreaLTC1,bt.ltc_2.value=U.state.rectAreaLTC2,bt.pointLights.value=U.state.point,bt.pointLightShadows.value=U.state.pointShadow,bt.hemisphereLights.value=U.state.hemi,bt.directionalShadowMap.value=U.state.directionalShadowMap,bt.directionalShadowMatrix.value=U.state.directionalShadowMatrix,bt.spotShadowMap.value=U.state.spotShadowMap,bt.spotLightMatrix.value=U.state.spotLightMatrix,bt.spotLightMap.value=U.state.spotLightMap,bt.pointShadowMap.value=U.state.pointShadowMap,bt.pointShadowMatrix.value=U.state.pointShadowMatrix),B.currentProgram=Ct,B.uniformsList=null,Ct}function wl(y){if(y.uniformsList===null){const I=y.currentProgram.getUniforms();y.uniformsList=Os.seqWithValue(I.seq,y.uniforms)}return y.uniformsList}function Rl(y,I){const O=Dt.get(y);O.outputColorSpace=I.outputColorSpace,O.batching=I.batching,O.batchingColor=I.batchingColor,O.instancing=I.instancing,O.instancingColor=I.instancingColor,O.instancingMorph=I.instancingMorph,O.skinning=I.skinning,O.morphTargets=I.morphTargets,O.morphNormals=I.morphNormals,O.morphColors=I.morphColors,O.morphTargetsCount=I.morphTargetsCount,O.numClippingPlanes=I.numClippingPlanes,O.numIntersection=I.numClipIntersection,O.vertexAlphas=I.vertexAlphas,O.vertexTangents=I.vertexTangents,O.toneMapping=I.toneMapping}function wh(y,I,O,B,U){I.isScene!==!0&&(I=At),Nt.resetTextureUnits();const it=I.fog,ft=B.isMeshStandardMaterial?I.environment:null,_t=A===null?v.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:ei,vt=(B.isMeshStandardMaterial?M:R).get(B.envMap||ft),Rt=B.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,Ct=!!O.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),bt=!!O.morphAttributes.position,$t=!!O.morphAttributes.normal,ae=!!O.morphAttributes.color;let oe=jn;B.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(oe=v.toneMapping);const Be=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,Kt=Be!==void 0?Be.length:0,St=Dt.get(B),ye=f.state.lights;if(W===!0&&(j===!0||y!==T)){const We=y===T&&B.id===L;Ft.setState(B,y,We)}let Zt=!1;B.version===St.__version?(St.needsLights&&St.lightsStateVersion!==ye.state.version||St.outputColorSpace!==_t||U.isBatchedMesh&&St.batching===!1||!U.isBatchedMesh&&St.batching===!0||U.isBatchedMesh&&St.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&St.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&St.instancing===!1||!U.isInstancedMesh&&St.instancing===!0||U.isSkinnedMesh&&St.skinning===!1||!U.isSkinnedMesh&&St.skinning===!0||U.isInstancedMesh&&St.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&St.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&St.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&St.instancingMorph===!1&&U.morphTexture!==null||St.envMap!==vt||B.fog===!0&&St.fog!==it||St.numClippingPlanes!==void 0&&(St.numClippingPlanes!==Ft.numPlanes||St.numIntersection!==Ft.numIntersection)||St.vertexAlphas!==Rt||St.vertexTangents!==Ct||St.morphTargets!==bt||St.morphNormals!==$t||St.morphColors!==ae||St.toneMapping!==oe||St.morphTargetsCount!==Kt)&&(Zt=!0):(Zt=!0,St.__version=B.version);let Ze=St.currentProgram;Zt===!0&&(Ze=qr(B,I,U));let bi=!1,ze=!1,va=!1;const fe=Ze.getUniforms(),Bn=St.uniforms;if(Et.useProgram(Ze.program)&&(bi=!0,ze=!0,va=!0),B.id!==L&&(L=B.id,ze=!0),bi||T!==y){fe.setValue(C,"projectionMatrix",y.projectionMatrix),fe.setValue(C,"viewMatrix",y.matrixWorldInverse);const We=fe.map.cameraPosition;We!==void 0&&We.setValue(C,at.setFromMatrixPosition(y.matrixWorld)),Jt.logarithmicDepthBuffer&&fe.setValue(C,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&fe.setValue(C,"isOrthographic",y.isOrthographicCamera===!0),T!==y&&(T=y,ze=!0,va=!0)}if(U.isSkinnedMesh){fe.setOptional(C,U,"bindMatrix"),fe.setOptional(C,U,"bindMatrixInverse");const We=U.skeleton;We&&(We.boneTexture===null&&We.computeBoneTexture(),fe.setValue(C,"boneTexture",We.boneTexture,Nt))}U.isBatchedMesh&&(fe.setOptional(C,U,"batchingTexture"),fe.setValue(C,"batchingTexture",U._matricesTexture,Nt),fe.setOptional(C,U,"batchingIdTexture"),fe.setValue(C,"batchingIdTexture",U._indirectTexture,Nt),fe.setOptional(C,U,"batchingColorTexture"),U._colorsTexture!==null&&fe.setValue(C,"batchingColorTexture",U._colorsTexture,Nt));const xa=O.morphAttributes;if((xa.position!==void 0||xa.normal!==void 0||xa.color!==void 0)&&Vt.update(U,O,Ze),(ze||St.receiveShadow!==U.receiveShadow)&&(St.receiveShadow=U.receiveShadow,fe.setValue(C,"receiveShadow",U.receiveShadow)),B.isMeshGouraudMaterial&&B.envMap!==null&&(Bn.envMap.value=vt,Bn.flipEnvMap.value=vt.isCubeTexture&&vt.isRenderTargetTexture===!1?-1:1),B.isMeshStandardMaterial&&B.envMap===null&&I.environment!==null&&(Bn.envMapIntensity.value=I.environmentIntensity),ze&&(fe.setValue(C,"toneMappingExposure",v.toneMappingExposure),St.needsLights&&Rh(Bn,va),it&&B.fog===!0&&Tt.refreshFogUniforms(Bn,it),Tt.refreshMaterialUniforms(Bn,B,Q,V,f.state.transmissionRenderTarget[y.id]),Os.upload(C,wl(St),Bn,Nt)),B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(Os.upload(C,wl(St),Bn,Nt),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&fe.setValue(C,"center",U.center),fe.setValue(C,"modelViewMatrix",U.modelViewMatrix),fe.setValue(C,"normalMatrix",U.normalMatrix),fe.setValue(C,"modelMatrix",U.matrixWorld),B.isShaderMaterial||B.isRawShaderMaterial){const We=B.uniformsGroups;for(let Ma=0,Ph=We.length;Ma<Ph;Ma++){const Cl=We[Ma];re.update(Cl,Ze),re.bind(Cl,Ze)}}return Ze}function Rh(y,I){y.ambientLightColor.needsUpdate=I,y.lightProbe.needsUpdate=I,y.directionalLights.needsUpdate=I,y.directionalLightShadows.needsUpdate=I,y.pointLights.needsUpdate=I,y.pointLightShadows.needsUpdate=I,y.spotLights.needsUpdate=I,y.spotLightShadows.needsUpdate=I,y.rectAreaLights.needsUpdate=I,y.hemisphereLights.needsUpdate=I}function Ch(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return b},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(y,I,O){Dt.get(y.texture).__webglTexture=I,Dt.get(y.depthTexture).__webglTexture=O;const B=Dt.get(y);B.__hasExternalTextures=!0,B.__autoAllocateDepthBuffer=O===void 0,B.__autoAllocateDepthBuffer||qt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),B.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(y,I){const O=Dt.get(y);O.__webglFramebuffer=I,O.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(y,I=0,O=0){A=y,w=I,b=O;let B=!0,U=null,it=!1,ft=!1;if(y){const vt=Dt.get(y);vt.__useDefaultFramebuffer!==void 0?(Et.bindFramebuffer(C.FRAMEBUFFER,null),B=!1):vt.__webglFramebuffer===void 0?Nt.setupRenderTarget(y):vt.__hasExternalTextures&&Nt.rebindTextures(y,Dt.get(y.texture).__webglTexture,Dt.get(y.depthTexture).__webglTexture);const Rt=y.texture;(Rt.isData3DTexture||Rt.isDataArrayTexture||Rt.isCompressedArrayTexture)&&(ft=!0);const Ct=Dt.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(Ct[I])?U=Ct[I][O]:U=Ct[I],it=!0):y.samples>0&&Nt.useMultisampledRTT(y)===!1?U=Dt.get(y).__webglMultisampledFramebuffer:Array.isArray(Ct)?U=Ct[O]:U=Ct,x.copy(y.viewport),P.copy(y.scissor),z=y.scissorTest}else x.copy(ct).multiplyScalar(Q).floor(),P.copy(dt).multiplyScalar(Q).floor(),z=Ut;if(Et.bindFramebuffer(C.FRAMEBUFFER,U)&&B&&Et.drawBuffers(y,U),Et.viewport(x),Et.scissor(P),Et.setScissorTest(z),it){const vt=Dt.get(y.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_CUBE_MAP_POSITIVE_X+I,vt.__webglTexture,O)}else if(ft){const vt=Dt.get(y.texture),Rt=I||0;C.framebufferTextureLayer(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,vt.__webglTexture,O||0,Rt)}L=-1},this.readRenderTargetPixels=function(y,I,O,B,U,it,ft){if(!(y&&y.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let _t=Dt.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&ft!==void 0&&(_t=_t[ft]),_t){Et.bindFramebuffer(C.FRAMEBUFFER,_t);try{const vt=y.texture,Rt=vt.format,Ct=vt.type;if(!Jt.textureFormatReadable(Rt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Jt.textureTypeReadable(Ct)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=y.width-B&&O>=0&&O<=y.height-U&&C.readPixels(I,O,B,U,It.convert(Rt),It.convert(Ct),it)}finally{const vt=A!==null?Dt.get(A).__webglFramebuffer:null;Et.bindFramebuffer(C.FRAMEBUFFER,vt)}}},this.readRenderTargetPixelsAsync=async function(y,I,O,B,U,it,ft){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let _t=Dt.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&ft!==void 0&&(_t=_t[ft]),_t){Et.bindFramebuffer(C.FRAMEBUFFER,_t);try{const vt=y.texture,Rt=vt.format,Ct=vt.type;if(!Jt.textureFormatReadable(Rt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Jt.textureTypeReadable(Ct))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(I>=0&&I<=y.width-B&&O>=0&&O<=y.height-U){const bt=C.createBuffer();C.bindBuffer(C.PIXEL_PACK_BUFFER,bt),C.bufferData(C.PIXEL_PACK_BUFFER,it.byteLength,C.STREAM_READ),C.readPixels(I,O,B,U,It.convert(Rt),It.convert(Ct),0),C.flush();const $t=C.fenceSync(C.SYNC_GPU_COMMANDS_COMPLETE,0);await Pd(C,$t,4);try{C.bindBuffer(C.PIXEL_PACK_BUFFER,bt),C.getBufferSubData(C.PIXEL_PACK_BUFFER,0,it)}finally{C.deleteBuffer(bt),C.deleteSync($t)}return it}}finally{const vt=A!==null?Dt.get(A).__webglFramebuffer:null;Et.bindFramebuffer(C.FRAMEBUFFER,vt)}}},this.copyFramebufferToTexture=function(y,I=null,O=0){y.isTexture!==!0&&(console.warn("WebGLRenderer: copyFramebufferToTexture function signature has changed."),I=arguments[0]||null,y=arguments[1]);const B=Math.pow(2,-O),U=Math.floor(y.image.width*B),it=Math.floor(y.image.height*B),ft=I!==null?I.x:0,_t=I!==null?I.y:0;Nt.setTexture2D(y,0),C.copyTexSubImage2D(C.TEXTURE_2D,O,0,0,ft,_t,U,it),Et.unbindTexture()},this.copyTextureToTexture=function(y,I,O=null,B=null,U=0){y.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture function signature has changed."),B=arguments[0]||null,y=arguments[1],I=arguments[2],U=arguments[3]||0,O=null);let it,ft,_t,vt,Rt,Ct;O!==null?(it=O.max.x-O.min.x,ft=O.max.y-O.min.y,_t=O.min.x,vt=O.min.y):(it=y.image.width,ft=y.image.height,_t=0,vt=0),B!==null?(Rt=B.x,Ct=B.y):(Rt=0,Ct=0);const bt=It.convert(I.format),$t=It.convert(I.type);Nt.setTexture2D(I,0),C.pixelStorei(C.UNPACK_FLIP_Y_WEBGL,I.flipY),C.pixelStorei(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),C.pixelStorei(C.UNPACK_ALIGNMENT,I.unpackAlignment);const ae=C.getParameter(C.UNPACK_ROW_LENGTH),oe=C.getParameter(C.UNPACK_IMAGE_HEIGHT),Be=C.getParameter(C.UNPACK_SKIP_PIXELS),Kt=C.getParameter(C.UNPACK_SKIP_ROWS),St=C.getParameter(C.UNPACK_SKIP_IMAGES),ye=y.isCompressedTexture?y.mipmaps[U]:y.image;C.pixelStorei(C.UNPACK_ROW_LENGTH,ye.width),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,ye.height),C.pixelStorei(C.UNPACK_SKIP_PIXELS,_t),C.pixelStorei(C.UNPACK_SKIP_ROWS,vt),y.isDataTexture?C.texSubImage2D(C.TEXTURE_2D,U,Rt,Ct,it,ft,bt,$t,ye.data):y.isCompressedTexture?C.compressedTexSubImage2D(C.TEXTURE_2D,U,Rt,Ct,ye.width,ye.height,bt,ye.data):C.texSubImage2D(C.TEXTURE_2D,U,Rt,Ct,it,ft,bt,$t,ye),C.pixelStorei(C.UNPACK_ROW_LENGTH,ae),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,oe),C.pixelStorei(C.UNPACK_SKIP_PIXELS,Be),C.pixelStorei(C.UNPACK_SKIP_ROWS,Kt),C.pixelStorei(C.UNPACK_SKIP_IMAGES,St),U===0&&I.generateMipmaps&&C.generateMipmap(C.TEXTURE_2D),Et.unbindTexture()},this.copyTextureToTexture3D=function(y,I,O=null,B=null,U=0){y.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture3D function signature has changed."),O=arguments[0]||null,B=arguments[1]||null,y=arguments[2],I=arguments[3],U=arguments[4]||0);let it,ft,_t,vt,Rt,Ct,bt,$t,ae;const oe=y.isCompressedTexture?y.mipmaps[U]:y.image;O!==null?(it=O.max.x-O.min.x,ft=O.max.y-O.min.y,_t=O.max.z-O.min.z,vt=O.min.x,Rt=O.min.y,Ct=O.min.z):(it=oe.width,ft=oe.height,_t=oe.depth,vt=0,Rt=0,Ct=0),B!==null?(bt=B.x,$t=B.y,ae=B.z):(bt=0,$t=0,ae=0);const Be=It.convert(I.format),Kt=It.convert(I.type);let St;if(I.isData3DTexture)Nt.setTexture3D(I,0),St=C.TEXTURE_3D;else if(I.isDataArrayTexture||I.isCompressedArrayTexture)Nt.setTexture2DArray(I,0),St=C.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}C.pixelStorei(C.UNPACK_FLIP_Y_WEBGL,I.flipY),C.pixelStorei(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),C.pixelStorei(C.UNPACK_ALIGNMENT,I.unpackAlignment);const ye=C.getParameter(C.UNPACK_ROW_LENGTH),Zt=C.getParameter(C.UNPACK_IMAGE_HEIGHT),Ze=C.getParameter(C.UNPACK_SKIP_PIXELS),bi=C.getParameter(C.UNPACK_SKIP_ROWS),ze=C.getParameter(C.UNPACK_SKIP_IMAGES);C.pixelStorei(C.UNPACK_ROW_LENGTH,oe.width),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,oe.height),C.pixelStorei(C.UNPACK_SKIP_PIXELS,vt),C.pixelStorei(C.UNPACK_SKIP_ROWS,Rt),C.pixelStorei(C.UNPACK_SKIP_IMAGES,Ct),y.isDataTexture||y.isData3DTexture?C.texSubImage3D(St,U,bt,$t,ae,it,ft,_t,Be,Kt,oe.data):I.isCompressedArrayTexture?C.compressedTexSubImage3D(St,U,bt,$t,ae,it,ft,_t,Be,oe.data):C.texSubImage3D(St,U,bt,$t,ae,it,ft,_t,Be,Kt,oe),C.pixelStorei(C.UNPACK_ROW_LENGTH,ye),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,Zt),C.pixelStorei(C.UNPACK_SKIP_PIXELS,Ze),C.pixelStorei(C.UNPACK_SKIP_ROWS,bi),C.pixelStorei(C.UNPACK_SKIP_IMAGES,ze),U===0&&I.generateMipmaps&&C.generateMipmap(St),Et.unbindTexture()},this.initRenderTarget=function(y){Dt.get(y).__webglFramebuffer===void 0&&Nt.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?Nt.setTextureCube(y,0):y.isData3DTexture?Nt.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?Nt.setTexture2DArray(y,0):Nt.setTexture2D(y,0),Et.unbindTexture()},this.resetState=function(){w=0,b=0,A=null,Et.reset(),zt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return In}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===sl?"display-p3":"srgb",e.unpackColorSpace=jt.workingColorSpace===oa?"display-p3":"srgb"}}class ca{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new Gt(t),this.density=e}clone(){return new ca(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class H_ extends Re{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Fn,this.environmentIntensity=1,this.environmentRotation=new Fn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class G_{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Bo,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=Jn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return al("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let r=0,s=this.stride;r<s;r++)this.array[t+r]=e.array[n+r];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Jn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Jn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Ce=new N;class $s{constructor(t,e,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.applyMatrix4(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.applyNormalMatrix(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.transformDirection(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=_n(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=te(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=te(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=te(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=te(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=te(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=_n(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=_n(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=_n(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=_n(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=te(e,this.array),n=te(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=te(e,this.array),n=te(n,this.array),r=te(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=r,this}setXYZW(t,e,n,r,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=te(e,this.array),n=te(n,this.array),r=te(r,this.array),s=te(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=r,this.data.array[t+3]=s,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const r=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[r+s])}return new Me(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new $s(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const r=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class Ho extends Ei{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Gt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let Vi;const pr=new N,Wi=new N,Xi=new N,qi=new kt,mr=new kt,Yu=new ce,ms=new N,gr=new N,gs=new N,bc=new kt,$a=new kt,Ac=new kt;class wc extends Re{constructor(t=new Ho){if(super(),this.isSprite=!0,this.type="Sprite",Vi===void 0){Vi=new Oe;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new G_(e,5);Vi.setIndex([0,1,2,0,2,3]),Vi.setAttribute("position",new $s(n,3,0,!1)),Vi.setAttribute("uv",new $s(n,2,3,!1))}this.geometry=Vi,this.material=t,this.center=new kt(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Wi.setFromMatrixScale(this.matrixWorld),Yu.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Xi.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Wi.multiplyScalar(-Xi.z);const n=this.material.rotation;let r,s;n!==0&&(s=Math.cos(n),r=Math.sin(n));const a=this.center;_s(ms.set(-.5,-.5,0),Xi,a,Wi,r,s),_s(gr.set(.5,-.5,0),Xi,a,Wi,r,s),_s(gs.set(.5,.5,0),Xi,a,Wi,r,s),bc.set(0,0),$a.set(1,0),Ac.set(1,1);let o=t.ray.intersectTriangle(ms,gr,gs,!1,pr);if(o===null&&(_s(gr.set(-.5,.5,0),Xi,a,Wi,r,s),$a.set(0,1),o=t.ray.intersectTriangle(ms,gs,gr,!1,pr),o===null))return;const l=t.ray.origin.distanceTo(pr);l<t.near||l>t.far||e.push({distance:l,point:pr.clone(),uv:Ye.getInterpolation(pr,ms,gr,gs,bc,$a,Ac,new kt),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function _s(i,t,e,n,r,s){qi.subVectors(i,e).addScalar(.5).multiply(n),r!==void 0?(mr.x=s*qi.x-r*qi.y,mr.y=r*qi.x+s*qi.y):mr.copy(qi),i.copy(t),i.x+=mr.x,i.y+=mr.y,i.applyMatrix4(Yu)}class $u extends Ei{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Gt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Ks=new N,Zs=new N,Rc=new ce,_r=new ol,vs=new Or,Ka=new N,Cc=new N;class V_ extends Re{constructor(t=new Oe,e=new $u){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let r=1,s=e.count;r<s;r++)Ks.fromBufferAttribute(e,r-1),Zs.fromBufferAttribute(e,r),n[r]=n[r-1],n[r]+=Ks.distanceTo(Zs);t.setAttribute("lineDistance",new Ve(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,r=this.matrixWorld,s=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),vs.copy(n.boundingSphere),vs.applyMatrix4(r),vs.radius+=s,t.ray.intersectsSphere(vs)===!1)return;Rc.copy(r).invert(),_r.copy(t.ray).applyMatrix4(Rc);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,u=n.index,h=n.attributes.position;if(u!==null){const m=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let _=m,f=g-1;_<f;_+=c){const p=u.getX(_),S=u.getX(_+1),v=xs(this,t,_r,l,p,S);v&&e.push(v)}if(this.isLineLoop){const _=u.getX(g-1),f=u.getX(m),p=xs(this,t,_r,l,_,f);p&&e.push(p)}}else{const m=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let _=m,f=g-1;_<f;_+=c){const p=xs(this,t,_r,l,_,_+1);p&&e.push(p)}if(this.isLineLoop){const _=xs(this,t,_r,l,g-1,m);_&&e.push(_)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const r=e[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function xs(i,t,e,n,r,s){const a=i.geometry.attributes.position;if(Ks.fromBufferAttribute(a,r),Zs.fromBufferAttribute(a,s),e.distanceSqToSegment(Ks,Zs,Ka,Cc)>n)return;Ka.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Ka);if(!(l<t.near||l>t.far))return{distance:l,point:Cc.clone().applyMatrix4(i.matrixWorld),index:r,face:null,faceIndex:null,object:i}}const Pc=new N,Lc=new N;class W_ extends V_{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let r=0,s=e.count;r<s;r+=2)Pc.fromBufferAttribute(e,r),Lc.fromBufferAttribute(e,r+1),n[r]=r===0?0:n[r-1],n[r+1]=n[r]+Pc.distanceTo(Lc);t.setAttribute("lineDistance",new Ve(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Ku extends Ei{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Gt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Dc=new ce,Go=new ol,Ms=new Or,Ss=new N;class X_ extends Re{constructor(t=new Oe,e=new Ku){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,r=this.matrixWorld,s=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ms.copy(n.boundingSphere),Ms.applyMatrix4(r),Ms.radius+=s,t.ray.intersectsSphere(Ms)===!1)return;Dc.copy(r).invert(),Go.copy(t.ray).applyMatrix4(Dc);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,d=n.attributes.position;if(c!==null){const h=Math.max(0,a.start),m=Math.min(c.count,a.start+a.count);for(let g=h,_=m;g<_;g++){const f=c.getX(g);Ss.fromBufferAttribute(d,f),Ic(Ss,f,l,r,t,e,this)}}else{const h=Math.max(0,a.start),m=Math.min(d.count,a.start+a.count);for(let g=h,_=m;g<_;g++)Ss.fromBufferAttribute(d,g),Ic(Ss,g,l,r,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const r=e[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Ic(i,t,e,n,r,s,a){const o=Go.distanceSqToPoint(i);if(o<e){const l=new N;Go.closestPointToPoint(i,l),l.applyMatrix4(n);const c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,object:a})}}class Pr extends Ie{constructor(t,e,n,r,s,a,o,l,c){super(t,e,n,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}const ys=new N,Es=new N,Za=new N,Ts=new Ye;class q_ extends Oe{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){const r=Math.pow(10,4),s=Math.cos(Fs*e),a=t.getIndex(),o=t.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],u=["a","b","c"],d=new Array(3),h={},m=[];for(let g=0;g<l;g+=3){a?(c[0]=a.getX(g),c[1]=a.getX(g+1),c[2]=a.getX(g+2)):(c[0]=g,c[1]=g+1,c[2]=g+2);const{a:_,b:f,c:p}=Ts;if(_.fromBufferAttribute(o,c[0]),f.fromBufferAttribute(o,c[1]),p.fromBufferAttribute(o,c[2]),Ts.getNormal(Za),d[0]=`${Math.round(_.x*r)},${Math.round(_.y*r)},${Math.round(_.z*r)}`,d[1]=`${Math.round(f.x*r)},${Math.round(f.y*r)},${Math.round(f.z*r)}`,d[2]=`${Math.round(p.x*r)},${Math.round(p.y*r)},${Math.round(p.z*r)}`,!(d[0]===d[1]||d[1]===d[2]||d[2]===d[0]))for(let S=0;S<3;S++){const v=(S+1)%3,E=d[S],w=d[v],b=Ts[u[S]],A=Ts[u[v]],L=`${E}_${w}`,T=`${w}_${E}`;T in h&&h[T]?(Za.dot(h[T].normal)<=s&&(m.push(b.x,b.y,b.z),m.push(A.x,A.y,A.z)),h[T]=null):L in h||(h[L]={index0:c[S],index1:c[v],normal:Za.clone()})}}for(const g in h)if(h[g]){const{index0:_,index1:f}=h[g];ys.fromBufferAttribute(o,_),Es.fromBufferAttribute(o,f),m.push(ys.x,ys.y,ys.z),m.push(Es.x,Es.y,Es.z)}this.setAttribute("position",new Ve(m,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}}class cl extends Oe{constructor(t=1,e=32,n=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const u=[],d=new N,h=new N,m=[],g=[],_=[],f=[];for(let p=0;p<=n;p++){const S=[],v=p/n;let E=0;p===0&&a===0?E=.5/e:p===n&&l===Math.PI&&(E=-.5/e);for(let w=0;w<=e;w++){const b=w/e;d.x=-t*Math.cos(r+b*s)*Math.sin(a+v*o),d.y=t*Math.cos(a+v*o),d.z=t*Math.sin(r+b*s)*Math.sin(a+v*o),g.push(d.x,d.y,d.z),h.copy(d).normalize(),_.push(h.x,h.y,h.z),f.push(b+E,1-v),S.push(c++)}u.push(S)}for(let p=0;p<n;p++)for(let S=0;S<e;S++){const v=u[p][S+1],E=u[p][S],w=u[p+1][S],b=u[p+1][S+1];(p!==0||a>0)&&m.push(v,E,b),(p!==n-1||l<Math.PI)&&m.push(E,w,b)}this.setIndex(m),this.setAttribute("position",new Ve(g,3)),this.setAttribute("normal",new Ve(_,3)),this.setAttribute("uv",new Ve(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new cl(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Jo}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Jo);var X=(i=>(i[i.Air=0]="Air",i[i.Stone=1]="Stone",i[i.Dirt=2]="Dirt",i[i.Grass=3]="Grass",i[i.Sand=4]="Sand",i[i.Water=5]="Water",i[i.Wood=6]="Wood",i[i.Leaves=7]="Leaves",i[i.Glass=8]="Glass",i[i.Planks=9]="Planks",i[i.Torch=10]="Torch",i[i.DoorBottom=11]="DoorBottom",i[i.DoorTop=12]="DoorTop",i))(X||{});const On={0:{name:"air",solid:!1,transparent:!0,kind:"cube",light:0,opacity:0,faces:[0,0,0,0,0,0]},1:{name:"stone",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[3,3,3,3,3,3]},2:{name:"dirt",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[2,2,2,2,2,2]},3:{name:"grass",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[1,1,0,2,1,1]},4:{name:"sand",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[4,4,4,4,4,4]},5:{name:"water",solid:!1,transparent:!0,kind:"cube",light:0,opacity:2,faces:[5,5,5,5,5,5]},6:{name:"wood",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[6,6,7,7,6,6]},7:{name:"leaves",solid:!0,transparent:!0,kind:"cube",light:0,opacity:2,faces:[8,8,8,8,8,8]},8:{name:"glass",solid:!0,transparent:!0,kind:"cube",light:0,opacity:1,faces:[9,9,9,9,9,9]},9:{name:"planks",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[10,10,10,10,10,10]},10:{name:"torch",solid:!1,transparent:!0,kind:"torch",light:14,opacity:0,faces:[11,11,11,11,11,11]},11:{name:"door",solid:!0,transparent:!0,kind:"door",light:0,opacity:15,faces:[13,13,13,13,13,13]},12:{name:"doorTop",solid:!0,transparent:!0,kind:"door",light:0,opacity:15,faces:[13,13,13,13,13,13]}};function rn(i){return i!==0&&!On[i].transparent}const Y_=[3,1,2,4,6,7,8,9,5,10,11];function $_(i){return On[i].faces[2]}function K_(i,t){return`-${$_(i)%16*t}px 0px`}function Z_(i){return i===0?0:1|i<<1}function Zu(i){return i===0?0:i>>1&7}function ju(i,t,e=0){return(i?1:0)|(t&1)<<1|(e&1)<<2}function ua(i){return(i&1)!==0}function ul(i){return i>>1&1}function hl(i){return i>>2&1}function Er(i){return i===11||i===12}function j_(i,t,e,n){let r;Math.abs(i)>=.001||Math.abs(t)>=.001?r=Math.abs(i)>=Math.abs(t)?0:1:r=n!==0?1:0;const s=(r===1?n:e)<0?1:0;return{axis:r,side:s}}function Vo(i,t,e){return t||e?1:i/8}const Qt=16,Xn=Qt*Qt*Qt,js=-32,Js=64;function le(i,t,e){return`${i},${t},${e}`}function ie(i,t,e){return i+e*Qt+t*Qt*Qt}function xt(i){return Math.floor(i/Qt)}class J_{constructor(){K(this,"chunks",new Map)}count(){return this.chunks.size}hasChunk(t,e,n){return this.chunks.has(le(t,e,n))}getChunk(t,e,n){return this.chunks.get(le(t,e,n))}ensureChunk(t,e,n){const r=le(t,e,n),s=this.chunks.get(r);if(s)return s;const a={cx:t,cy:e,cz:n,blocks:new Uint8Array(Xn),meta:new Uint8Array(Xn),wlevel:new Uint8Array(Xn),wsource:new Uint8Array(Xn),wplaced:new Uint8Array(Xn),wstream:new Uint8Array(Xn),blight:new Uint8Array(Xn),skylight:new Uint8Array(Xn),colSum:new Uint8Array(256),dirty:!0,settled:!1,lightSettled:!1,edited:!1,editGen:0,savedGen:0,opaqueMesh:null,transMesh:null};return this.chunks.set(r,a),a}getBlock(t,e,n){const r=this.getChunk(xt(t),xt(e),xt(n));if(!r)return X.Air;const s=t-r.cx*Qt,a=e-r.cy*Qt,o=n-r.cz*Qt;return r.blocks[ie(s,a,o)]}getMeta(t,e,n){const r=this.getChunk(xt(t),xt(e),xt(n));return r?r.meta[ie(t-r.cx*Qt,e-r.cy*Qt,n-r.cz*Qt)]:0}getWaterHeight(t,e,n){const r=this.getChunk(xt(t),xt(e),xt(n));if(!r)return 0;const s=ie(t-r.cx*Qt,e-r.cy*Qt,n-r.cz*Qt);return Vo(r.wlevel[s],r.wsource[s],r.wstream[s])}getLight(t,e,n){const r=this.getChunk(xt(t),xt(e),xt(n));if(!r)return[0,0];const s=ie(t-r.cx*Qt,e-r.cy*Qt,n-r.cz*Qt);return[r.blight[s],r.skylight[s]]}setBlock(t,e,n,r,s=0,a=!0){const o=this.getChunk(xt(t),xt(e),xt(n));if(!o)return!1;const l=ie(t-o.cx*Qt,e-o.cy*Qt,n-o.cz*Qt);if(o.blocks[l]===r&&o.meta[l]===s)return!1;o.blocks[l]=r,o.meta[l]=s,o.dirty=!0,a&&(o.editGen+=1,o.edited=!0);const c=[[o.cx+1,o.cy,o.cz],[o.cx-1,o.cy,o.cz],[o.cx,o.cy+1,o.cz],[o.cx,o.cy-1,o.cz],[o.cx,o.cy,o.cz+1],[o.cx,o.cy,o.cz-1]];for(const[u,d,h]of c){const m=this.getChunk(u,d,h);m&&(m.dirty=!0)}return!0}isSolid(t,e,n){const r=this.getBlock(t,e,n);return r===X.Air||r===X.Torch?!1:Er(r)?!ua(this.getMeta(t,e,n)):r===X.Leaves?!0:rn(r)}removeChunk(t,e,n){return this.chunks.delete(le(t,e,n))}*allChunks(){yield*this.chunks.values()}clear(){this.chunks.clear()}}const Ju=Math.sqrt(3),Q_=.5*(Ju-1),vr=(3-Ju)/6,t0=1/3,fn=1/6,wr=i=>Math.floor(i)|0,Uc=new Float64Array([1,1,-1,1,1,-1,-1,-1,1,0,-1,0,1,0,-1,0,0,1,0,-1,0,1,0,-1]),ja=new Float64Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]);function Qu(i=Math.random){const t=th(i),e=new Float64Array(t).map(r=>Uc[r%12*2]),n=new Float64Array(t).map(r=>Uc[r%12*2+1]);return function(s,a){let o=0,l=0,c=0;const u=(s+a)*Q_,d=wr(s+u),h=wr(a+u),m=(d+h)*vr,g=d-m,_=h-m,f=s-g,p=a-_;let S,v;f>p?(S=1,v=0):(S=0,v=1);const E=f-S+vr,w=p-v+vr,b=f-1+2*vr,A=p-1+2*vr,L=d&255,T=h&255;let x=.5-f*f-p*p;if(x>=0){const F=L+t[T],H=e[F],q=n[F];x*=x,o=x*x*(H*f+q*p)}let P=.5-E*E-w*w;if(P>=0){const F=L+S+t[T+v],H=e[F],q=n[F];P*=P,l=P*P*(H*E+q*w)}let z=.5-b*b-A*A;if(z>=0){const F=L+1+t[T+1],H=e[F],q=n[F];z*=z,c=z*z*(H*b+q*A)}return 70*(o+l+c)}}function e0(i=Math.random){const t=th(i),e=new Float64Array(t).map(s=>ja[s%12*3]),n=new Float64Array(t).map(s=>ja[s%12*3+1]),r=new Float64Array(t).map(s=>ja[s%12*3+2]);return function(a,o,l){let c,u,d,h;const m=(a+o+l)*t0,g=wr(a+m),_=wr(o+m),f=wr(l+m),p=(g+_+f)*fn,S=g-p,v=_-p,E=f-p,w=a-S,b=o-v,A=l-E;let L,T,x,P,z,F;w>=b?b>=A?(L=1,T=0,x=0,P=1,z=1,F=0):w>=A?(L=1,T=0,x=0,P=1,z=0,F=1):(L=0,T=0,x=1,P=1,z=0,F=1):b<A?(L=0,T=0,x=1,P=0,z=1,F=1):w<A?(L=0,T=1,x=0,P=0,z=1,F=1):(L=0,T=1,x=0,P=1,z=1,F=0);const H=w-L+fn,q=b-T+fn,V=A-x+fn,Q=w-P+2*fn,G=b-z+2*fn,ht=A-F+2*fn,ct=w-1+3*fn,dt=b-1+3*fn,Ut=A-1+3*fn,Ht=g&255,W=_&255,j=f&255;let ot=.6-w*w-b*b-A*A;if(ot<0)c=0;else{const Mt=Ht+t[W+t[j]];ot*=ot,c=ot*ot*(e[Mt]*w+n[Mt]*b+r[Mt]*A)}let at=.6-H*H-q*q-V*V;if(at<0)u=0;else{const Mt=Ht+L+t[W+T+t[j+x]];at*=at,u=at*at*(e[Mt]*H+n[Mt]*q+r[Mt]*V)}let yt=.6-Q*Q-G*G-ht*ht;if(yt<0)d=0;else{const Mt=Ht+P+t[W+z+t[j+F]];yt*=yt,d=yt*yt*(e[Mt]*Q+n[Mt]*G+r[Mt]*ht)}let At=.6-ct*ct-dt*dt-Ut*Ut;if(At<0)h=0;else{const Mt=Ht+1+t[W+1+t[j+1]];At*=At,h=At*At*(e[Mt]*ct+n[Mt]*dt+r[Mt]*Ut)}return 32*(c+u+d+h)}}function th(i){const e=new Uint8Array(512);for(let n=0;n<512/2;n++)e[n]=n;for(let n=0;n<512/2-1;n++){const r=n+~~(i()*(256-n)),s=e[n];e[n]=e[r],e[r]=s}for(let n=256;n<512;n++)e[n]=e[n-256];return e}const Tr=32,xn=1234;function Nc(i){let t=i>>>0;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^t>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function Fc(i,t,e){let n=(i^Math.imul(t,2654435769)^Math.imul(e,2246822507))>>>0;return n=Math.imul(n^n>>>13,3432918353)>>>0,n=Math.imul(n^n>>>15,461845907)>>>0,((n^n>>>15)>>>0)/4294967296}class eh{constructor(t){K(this,"n2");K(this,"n3");K(this,"seed");this.seed=t,this.n2=Qu(Nc(t)),this.n3=e0(Nc(t^2654435769|0))}heightAt(t,e){const n=[.008,.02,.05,.11],r=[1,.5,.25,.125];let s=0;for(let o=0;o<4;o++)s+=this.n2(t*n[o],e*n[o])*r[o];const a=1+.5+.25+.125;return Math.floor(Tr+s/a*20)}caveAt(t,e,n){return this.n3(t*.06,e*.06,n*.06)}}function nh(i,t,e,n,r){const s=i.ensureChunk(e,n,r),a=e*16,o=n*16,l=r*16;for(let c=0;c<16;c++)for(let u=0;u<16;u++){const d=a+c,h=l+u,m=t.heightAt(d,h);for(let g=0;g<16;g++){const _=o+g,f=ie(c,g,u);if(_>m){s.blocks[f]=_<=Tr?X.Water:X.Air;continue}_<m-4?s.blocks[f]=X.Stone:_<m?s.blocks[f]=X.Dirt:s.blocks[f]=m<Tr+1?X.Sand:X.Grass,(s.blocks[f]===X.Stone||s.blocks[f]===X.Dirt)&&_<=Tr&&t.caveAt(d,_,h)>.55&&(s.blocks[f]=X.Air)}}for(let c=3;c<=12;c++)for(let u=3;u<=12;u++){const d=a+c,h=l+u,m=t.heightAt(d,h);if(m<Tr+1||Fc(t.seed,d,h)>=.02)continue;const g=4+Math.floor(Fc(t.seed^20907|0,d,h)*3);for(let _=0;_<g;_++){const f=m+1+_,p=f-o;f<o||p>=16||(s.blocks[ie(c,p,u)]=X.Wood)}for(let _=m+g-1;_<=m+g+2;_++){const f=_<m+g?2:1;for(let p=-f;p<=f;p++)for(let S=-f;S<=f;S++){if(Math.abs(p)===f&&Math.abs(S)===f)continue;const v=_-o;if(v<0||v>=16)continue;const E=ie(c+p,v,u+S);s.blocks[E]===X.Air&&(s.blocks[E]=X.Leaves)}}}s.dirty=!0}const n0="__meta__";function i0(i,t,e,n){return`${i}:${t},${e},${n}`}function Ja(i){return`${i}:${n0}`}function Wo(i,t){const e={v:2,cx:i.cx,cy:i.cy,cz:i.cz,blocks:i.blocks.slice(),meta:i.meta.slice(),wlevel:i.wlevel.slice(),wsource:i.wsource.slice(),wplaced:i.wplaced.slice(),wstream:i.wstream.slice()};return t&&t.length&&(e.entities=t),e}function Qs(i,t,e,n){const r=i.ensureChunk(t.cx,t.cy,t.cz);r.blocks.set(t.blocks),r.meta.set(t.meta),r.wlevel.set(t.wlevel),r.wsource.set(t.wsource),r.wplaced.set(t.wplaced),r.wstream.set(t.wstream),r.settled=!0,r.edited=!0,r.editGen=1,r.savedGen=1,r.dirty=!1,t.entities&&e&&n&&e.restoreEntities(t.entities,n)}function r0(i){if(!i||!("v"in i))return null;if(i.v===2&&"entities"in i)return i;const t=i;return"player"in i?{v:2,seed:t.seed,entities:[{id:1,kindId:"player",x:t.player.x,y:t.player.y,z:t.player.z,vx:0,vy:0,vz:0,yaw:t.player.yaw,pitch:t.player.pitch,fly:!1,noclip:!1,controllerKind:"human"}],viewedEntityId:1,time:t.time,hotbar:t.hotbar}:null}const s0=512;class Oc{constructor(t,e,n){K(this,"store");K(this,"replayStore");K(this,"seed");K(this,"warm",new Map);K(this,"persistedKeys",new Set);K(this,"inFlight",new Map);K(this,"pendingPuts",new Set);K(this,"meta",null);this.store=t,this.seed=e,this.replayStore=n??null}key(t,e,n){return i0(this.seed,t,e,n)}saveReplay(t,e){var n;(n=this.replayStore)==null||n.putReplay(t,e).catch(()=>{})}loadReplay(t){var e;return((e=this.replayStore)==null?void 0:e.getReplay(t).catch(()=>{}))??Promise.resolve(void 0)}listReplays(){var t;return((t=this.replayStore)==null?void 0:t.listReplays().catch(()=>[]))??Promise.resolve([])}async boot(){if(!this.store)return null;try{const t=await this.store.keys(`${this.seed}:`);for(const n of t)n.startsWith(`${this.seed}:`)&&this.persistedKeys.add(n);const e=await this.store.get(Ja(this.seed));e&&(this.meta=r0(e))}catch{}return this.meta}hasPersisted(t,e,n){return this.persistedKeys.has(this.key(t,e,n))}syncRecord(t,e,n){return this.warm.get(this.key(t,e,n))}fetchRecord(t,e,n){const r=this.key(t,e,n),s=this.warm.get(r);if(s)return Promise.resolve(s);const a=this.inFlight.get(r);if(a)return a;const o=(async()=>{if(this.store)try{const l=await this.store.get(r);return l&&"cx"in l&&this.cache(r,l),l&&"cx"in l?l:void 0}catch{return}finally{this.inFlight.delete(r)}})();return this.inFlight.set(r,o),o}isDue(t){return t.edited&&!(t.editGen>0&&t.savedGen===t.editGen)}onUnload(t,e){if(!t.edited)return;const n=this.key(t.cx,t.cy,t.cz),r=Wo(t,e);if(this.cache(n,r),this.persistedKeys.add(n),!this.isDue(t)||(t.savedGen=t.editGen,!this.store))return;const s=this.store.put(n,r).catch(()=>{});this.pendingPuts.add(s),s.then(()=>this.pendingPuts.delete(s))}saveLoaded(t,e){if(this.meta=e,!this.store)return;const n=[];for(const s of t){if(!this.isDue(s))continue;const a=this.key(s.cx,s.cy,s.cz),o=Wo(s);s.savedGen=s.editGen,this.persistedKeys.add(a),n.push([a,o])}n.push([Ja(this.seed),e]);const r=this.store.putMany(n).catch(()=>{});this.pendingPuts.add(r),r.then(()=>this.pendingPuts.delete(r))}dropPersisted(t,e,n){const r=this.key(t,e,n);this.persistedKeys.delete(r),this.warm.delete(r)}saveMeta(t){if(this.meta=t,!this.store)return;const e=this.store.put(Ja(this.seed),t).catch(()=>{});this.pendingPuts.add(e),e.then(()=>this.pendingPuts.delete(e))}flush(){return Promise.all([...this.pendingPuts]).then(()=>{}).catch(()=>{})}cache(t,e){for(this.warm.has(t)&&this.warm.delete(t),this.warm.set(t,e);this.warm.size>s0;){const n=this.warm.keys().next().value;this.warm.delete(n)}}}const a0=new eh(xn),Ki=2,Bc=0,zc=4,o0=1,l0=1;function kc(i,t,e,n){const r=i.cx-t,s=i.cz-e;return(r*r+s*s)*100+Math.abs(i.cy-n)}function Qa(i,t,e,n,r){return kc(i,e,n,r)-kc(t,e,n,r)||i.cx-t.cx||i.cy-t.cy||i.cz-t.cz}function ta(i,t,e,n){return Math.abs(i-e)<=Ki&&Math.abs(t-n)<=Ki}function Rr(i,t,e,n,r,s){const a=[[t+1,e,n],[t-1,e,n],[t,e+1,n],[t,e-1,n],[t,e,n+1],[t,e,n-1]];for(const[o,l,c]of a){const u=i.getChunk(o,l,c);u&&ta(o,c,r,s)&&(u.dirty=!0)}}function c0(i,t,e,n=2,r,s){const a=[],o=[],l=[],c=[],u=new Set,d=[];for(let g=-Ki;g<=Ki;g++)for(let _=-Ki;_<=Ki;_++)for(let f=Bc;f<=zc;f++){const p=t+g,S=e+_;if(i.hasChunk(p,f,S))continue;const v=r==null?void 0:r.syncRecord(p,f,S);if(v){Qs(i,v),Rr(i,p,f,S,t,e),o.push({cx:p,cy:f,cz:S}),u.add(le(p,f,S));continue}if(r!=null&&r.hasPersisted(p,f,S)){l.push({cx:p,cy:f,cz:S});continue}d.push({cx:p,cy:f,cz:S})}d.sort((g,_)=>Qa(g,_,t,e,n));for(const g of d.slice(0,o0))i.ensureChunk(g.cx,g.cy,g.cz),nh(i,a0,g.cx,g.cy,g.cz),Rr(i,g.cx,g.cy,g.cz,t,e),a.push(g),u.add(le(g.cx,g.cy,g.cz));l.sort((g,_)=>Qa(g,_,t,e,n));const h=[];for(const g of i.allChunks())!g.dirty||u.has(le(g.cx,g.cy,g.cz))||ta(g.cx,g.cz,t,e)&&h.push({cx:g.cx,cy:g.cy,cz:g.cz});h.sort((g,_)=>Qa(g,_,t,e,n));for(const g of h.slice(0,l0))a.push(g),u.add(le(g.cx,g.cy,g.cz));const m=[];for(const g of i.allChunks())(!ta(g.cx,g.cz,t,e)||g.cy<Bc||g.cy>zc)&&m.push(g);for(const g of m){const _=s?s.entitiesInChunk(g.cx,g.cy,g.cz).map(f=>s.toRecord(f)):void 0;r==null||r.onUnload(g,_),Rr(i,g.cx,g.cy,g.cz,t,e),i.removeChunk(g.cx,g.cy,g.cz),c.push({cx:g.cx,cy:g.cy,cz:g.cz})}return{rebuilt:a,restored:o,pending:l,unloaded:c}}const wn=9;class u0{constructor(t){K(this,"slots");K(this,"selected",0);K(this,"onSelectChange");K(this,"onSlotChange");this.slots=Array.from({length:wn},(e,n)=>t[n]??t[0]??X.Stone),t.length>wn&&(this.slots.length=wn)}get block(){return this.slots[this.selected]}select(t){var n;const e=(t%wn+wn)%wn;e!==this.selected&&(this.selected=e,(n=this.onSelectChange)==null||n.call(this,e))}cycle(t){this.select(this.selected+(t>=0?1:-1))}setSlot(t,e){var r;const n=(t%wn+wn)%wn;this.slots[n]=e,(r=this.onSlotChange)==null||r.call(this,n)}}const zr=[{dir:[1,0,0],axes:[2,1],corners:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]]},{dir:[-1,0,0],axes:[2,1],corners:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]},{dir:[0,1,0],axes:[0,2],corners:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},{dir:[0,-1,0],axes:[0,2],corners:[[1,0,1],[0,0,1],[0,0,0],[1,0,0]]},{dir:[0,0,1],axes:[0,1],corners:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]},{dir:[0,0,-1],axes:[0,1],corners:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]}],dl=[.6,.6,1,.5,.8,.8],h0=[1,.8,.62,.48];class Hc{constructor(){K(this,"pos",[]);K(this,"col",[]);K(this,"uv",[]);K(this,"idx",[]);K(this,"light",[]);K(this,"verts",0)}push(t,e,n,r,s,a,o,l){this.pos.push(t,e,n),this.col.push(r,r,r,1),this.uv.push(s,a),this.light.push(o,l),this.verts++}toBuffer(){return this.verts===0?null:{positions:new Float32Array(this.pos),colors:new Float32Array(this.col),uvs:new Float32Array(this.uv),indices:new Uint32Array(this.idx),light:new Float32Array(this.light)}}}const tn=11,Gc=12,Yi=13,d0=[0,0,1,4,5],$e=1e-6;function f0(i,t){if(i===X.Torch){const r=Zu(t);return r===0?{min:[.41,0,.41],size:[.18,.875,.18]}:r===1?{min:[0,.41,.41],size:[.375,.18,.18]}:r===2?{min:[1-.375,.41,.41],size:[.375,.18,.18]}:r===3?{min:[.41,.41,0],size:[.18,.18,.375]}:{min:[.41,.41,1-.375],size:[.18,.18,.375]}}const e=ul(t)===0,n=hl(t);return ua(t)?{min:[0,0,0],size:e?[1,1,.2]:[.2,1,1]}:e?{min:n===1?[.8,0,0]:[0,0,0],size:[.2,1,1]}:{min:n===1?[0,0,.8]:[0,0,0],size:[1,1,.2]}}function Vc(i,t){const{min:e,size:n}=f0(i,t),r=[];for(let s=0;s<6;s++){const a=s>>1,o=s&1?e[a]<=$e:e[a]+n[a]>=1-$e;let l=null;if(o){const[c,u]=zr[s].axes;l={u0:e[c],u1:e[c]+n[c],v0:e[u],v1:e[u]+n[u]}}r.push({reach:o,cov:l})}return r}function p0(i,t){return i.u0<=t.u0+$e&&i.v0<=t.v0+$e&&i.u1>=t.u1-$e&&i.v1>=t.v1-$e}function m0(i,t){return Math.abs(i.u0-t.u0)<=$e&&Math.abs(i.u1-t.u1)<=$e&&Math.abs(i.v0-t.v0)<=$e&&Math.abs(i.v1-t.v1)<=$e}function g0(i,t){for(let e=0;e<3;e++)if(i[e]!==t[e])return i[e]>t[e];return!1}const ih=(i,t,e,n,r,s,a)=>{const o=Vc(s,a);return l=>{const c=o[l];if(!c.reach)return!1;const u=zr[l].dir,d=e+u[0],h=n+u[1],m=r+u[2],g=i(d,h,m);if(rn(g))return!0;if(On[g].kind==="cube")return!1;const _=Vc(g,t(d,h,m))[l^1];return!_.reach||!p0(_.cov,c.cov)?!1:!m0(_.cov,c.cov)||g0([e,n,r],[d,h,m])}};function $n(i,t,e,n,r,s,a,o,l,c){for(let u=0;u<6;u++){if(r(u))continue;if(!a.takeFace())return;const d=zr[u],[h,m]=d.axes,g=n[u],_=g%16,f=g/16|0;for(const S of d.corners){const[v,E]=fl(s,o,l,c,d,S);i.push(t[0]+S[0]*e[0],t[1]+S[1]*e[1],t[2]+S[2]*e[2],dl[u],(_+S[h])/16,(15-f+S[m])/16,v,E)}const p=i.verts-4;i.idx.push(p,p+1,p+2,p,p+2,p+3)}}function _0(i,t,e,n,r,s,a,o,l){const c=ih(t,e,n,r,s,X.Torch,a),u=Zu(a);if(u===0){$n(i,[n+.41,r,s+.41],[.18,.875,.18],[tn,tn,Gc,tn,tn,tn],c,o,l,n,r,s);return}const d=[tn,tn,tn,tn,tn,tn];d[d0[u]]=Gc,u===1?$n(i,[n,r+.41,s+.41],[.375,.18,.18],d,c,o,l,n,r,s):u===2?$n(i,[n+1-.375,r+.41,s+.41],[.375,.18,.18],d,c,o,l,n,r,s):u===3?$n(i,[n+.41,r+.41,s],[.18,.18,.375],d,c,o,l,n,r,s):$n(i,[n+.41,r+.41,s+1-.375],[.18,.18,.375],d,c,o,l,n,r,s)}function v0(i,t,e,n,r,s,a,o,l){const c=ih(t,e,n,r,s,X.DoorBottom,a),u=ul(a)===0,d=hl(a),h=[Yi,Yi,Yi,Yi,Yi,Yi];ua(a)?$n(i,[n,r,s],u?[1,1,.2]:[.2,1,1],h,c,o,l,n,r,s):u?$n(i,d===1?[n+.8,r,s]:[n,r,s],[.2,1,1],h,c,o,l,n,r,s):$n(i,d===1?[n,r,s+.8]:[n,r,s],[1,1,.2],h,c,o,l,n,r,s)}function x0(i,t,e,n,r,s,a,o,l){const c=On[X.Water].faces[0],u=c%16,d=c/16|0;for(let h=0;h<6;h++){const m=zr[h],g=n+m.dir[0],_=r+m.dir[1],f=s+m.dir[2],p=t(g,_,f);if(rn(p))continue;const S=p===X.Water?e(g,_,f):0;if(h===2){if(p===X.Water&&a>=1-$e)continue}else if(h===3){if(S>=1-$e)continue}else if(p===X.Water&&a<=S)continue;if(!l.takeFace())return;const[v,E]=m.axes;for(const b of m.corners){const[A,L]=fl(o,n,r,s,m,b);i.push(n+b[0],r+b[1]*a,s+b[2],dl[h],(u+b[v])/16,(15-d+(E===1?b[E]*a:b[E]))/16,A,L)}const w=i.verts-4;i.idx.push(w,w+1,w+2,w,w+2,w+3)}}function fl(i,t,e,n,r,s){const a=r.dir[0],o=r.dir[1],l=r.dir[2],c=r.axes[0],u=r.axes[1],d=s[c]===1?1:-1,h=s[u]===1?1:-1,m=t+a,g=e+o,_=n+l,f=c===0?d:0,p=c===1?d:0,S=c===2?d:0,v=u===0?h:0,E=u===1?h:0,w=u===2?h:0;let b=0,A=0;for(const[L,T,x]of[[0,0,0],[f,p,S],[v,E,w],[f+v,p+E,S+w]]){const[P,z]=i(m+L,g+T,_+x);P>b&&(b=P),z>A&&(A=z)}return[b/15,A/15]}class M0{constructor(t){K(this,"remaining");K(this,"truncated",!1);this.remaining=t}takeFace(){return this.remaining<4?(this.truncated=!0,!1):(this.remaining-=4,!0)}}function pl(i,t,e,n,r,s,a,o){const l=i.getChunk(t,e,n);if(!l)return{mesh:{opaque:null,trans:null},complete:!0};const c=t*16,u=e*16,d=n*16,h=new Hc,m=new Hc,g=new M0(o),_=(S,v,E)=>S>=c&&S<c+16&&v>=u&&v<u+16&&E>=d&&E<d+16?l.blocks[ie(S-c,v-u,E-d)]:i.getBlock(S,v,E),f=(S,v,E)=>S>=c&&S<c+16&&v>=u&&v<u+16&&E>=d&&E<d+16?l.meta[ie(S-c,v-u,E-d)]:i.getMeta(S,v,E),p=(S,v,E)=>{if(!(S>=c&&S<c+16&&v>=u&&v<u+16&&E>=d&&E<d+16))return i.getWaterHeight(S,v,E);const b=ie(S-c,v-u,E-d);return Vo(l.wlevel[b],l.wsource[b],l.wstream[b])};t:for(let S=s;S<a;S++)for(let v=0;v<16;v++)for(let E=0;E<16;E++){const w=l.blocks[ie(E,S,v)];if(w===X.Air)continue;const b=On[w].kind,A=c+E,L=u+S,T=d+v;if(b!=="cube"){b==="torch"?_0(h,_,f,A,L,T,l.meta[ie(E,S,v)],r,g):v0(h,_,f,A,L,T,l.meta[ie(E,S,v)],r,g);continue}const x=rn(w);if(w===X.Water){const P=Vo(l.wlevel[ie(E,S,v)],l.wsource[ie(E,S,v)],l.wstream[ie(E,S,v)]);x0(m,_,p,A,L,T,P,r,g);continue}for(let P=0;P<6;P++){const z=zr[P],F=A+z.dir[0],H=L+z.dir[1],q=T+z.dir[2],V=_(F,H,q),Q=x&&!rn(V),G=!x&&!rn(V)&&V!==w;if(!Q&&!G)continue;if(!g.takeFace())break t;const ht=Q?h:m,[ct,dt]=z.axes,Ut=On[w].faces[P],Ht=Ut%16,W=Ut/16|0;for(const ot of z.corners){const at=ot[ct]===1?1:-1,yt=ot[dt]===1?1:-1,At=rn(_(F+(ct===0?at:0),H+(ct===1?at:0),q+(ct===2?at:0)))?1:0,Mt=rn(_(F+(dt===0?yt:0),H+(dt===1?yt:0),q+(dt===2?yt:0)))?1:0,ne=rn(_(F+(ct===0?at:0)+(dt===0?yt:0),H+(ct===1?at:0)+(dt===1?yt:0),q+(ct===2?at:0)+(dt===2?yt:0)))?1:0,C=At&&Mt?3:At+Mt+ne,[se,qt]=fl(r,A,L,T,z,ot);ht.push(A+ot[0],L+ot[1],T+ot[2],dl[P]*h0[C],(Ht+ot[ct])/16,(15-W+ot[dt])/16,se,qt)}const j=ht.verts-4;ht.idx.push(j,j+1,j+2,j,j+2,j+3)}}return{mesh:{opaque:h.toBuffer(),trans:m.toBuffer()},complete:!g.truncated}}const S0=()=>[0,0];function y0(i,t,e,n,r=S0){return pl(i,t,e,n,r,0,16,1/0).mesh}function Wc(i,t,e,n,r,s,a){return pl(i,t,e,n,r,s,a,1/0).mesh}function E0(i,t,e,n,r,s){return pl(i,t,e,n,r,0,16,s)}const T0=3764,b0=4;function A0(i,t){const e=new Array(16).fill(0);for(let a=0;a<16;a++)for(let o=0;o<256;o++)i.blocks[a*256+o]!==X.Air&&e[a]++;const n=e.reduce((a,o)=>a+o,0),r=[0];if(n===0)for(let a=1;a<t;a++)r.push(Math.floor(16*a/t));else{let a=0,o=0;for(let l=1;l<t;l++){const c=n*l/t;for(;o<15&&(o++,a+=e[o-1],!(a>=c)););r.push(o)}}r.push(16);const s=[];for(let a=0;a<t;a++)s.push([r[a],r[a+1]]);return s}function Xc(i){const t=i.filter(g=>g!==null);if(t.length===0)return null;const e=t.reduce((g,_)=>g+_.positions.length/3,0),n=new Float32Array(e*3),r=new Float32Array(e*4),s=new Float32Array(e*2),a=new Float32Array(e*2),o=new Uint32Array(t.reduce((g,_)=>g+_.indices.length,0));let l=0,c=0,u=0,d=0,h=0,m=0;for(const g of t){const _=g.positions.length/3;n.set(g.positions,c),r.set(g.colors,u),s.set(g.uvs,d),a.set(g.light,h);for(let f=0;f<g.indices.length;f++)o[m+f]=g.indices[f]+l;m+=g.indices.length,l+=_,c+=_*3,u+=_*4,d+=_*2,h+=_*2}return{positions:n,colors:r,uvs:s,indices:o,light:a}}function w0(i){return{opaque:Xc(i.map(t=>t.opaque)),trans:Xc(i.map(t=>t.trans))}}class R0{constructor(){K(this,"plans",new Map)}start(t,e){return this.plans.size>0?!1:(this.plans.set(t,{bands:e,next:0,partial:new Array(e.length).fill(null)}),!0)}has(t){return this.plans.has(t)}inFlightKey(){const t=this.plans.keys().next();return t.done?null:t.value}advance(t){const e=this.plans.get(t);return!e||e.next>=e.bands.length?null:e.bands[e.next]}store(t,e){const n=this.plans.get(t);n&&(n.partial[n.next]=e,n.next++)}finish(t){const e=this.plans.get(t);return!e||e.next<e.bands.length?null:(this.plans.delete(t),w0(e.partial.filter(n=>n!==null)))}cancel(t){this.plans.delete(t)}}const pi="2,1,0",to=6312,xr=16.7,qc=25,Yc=600,$c=300,C0=10,P0={x:8,y:34,z:200};function bs(i){let t=0;for(const e of[i.opaque,i.trans])e&&(t+=e.positions.length/3);return t}class L0{constructor(t){K(this,"frame",0);K(this,"seg","A");K(this,"bLeft",$c);K(this,"finished",!1);K(this,"windowStart",null);K(this,"windowEnd",null);K(this,"lastRemeshFrame",null);K(this,"cycles",[]);K(this,"open",null);K(this,"aTotals",[]);K(this,"bTotals",[]);K(this,"drains",[]);K(this,"reason",null);K(this,"opts");this.opts=t}beginFrame(t){const e=this.frame;if(t.worstLoaded&&this.windowStart===null&&(this.windowStart=e),this.seg==="A"){const n=t.worstSettled&&this.lastRemeshFrame!==null&&e-this.lastRemeshFrame>=C0&&this.cycles.some(r=>r.kind==="sliced"&&r.verts===to);(n||e+1>=Yc)&&(n?this.windowEnd=this.lastRemeshFrame:this.reason=`segment A cap: worst chunk not settled by frame ${Yc-1}`,this.seg="B",this.bLeft=$c)}return this.seg==="B"&&this.bLeft--,{waypoint:this.seg==="B"?{...P0}:{...this.opts.anchor}}}noteRemesh(t,e){const n=this.frame;this.lastRemeshFrame=n,t==="probe-complete"?(this.open&&this.pushOpen(),this.cycles.push({kind:"probe-complete",frames:[n],maxFrameMs:0,verts:e})):t==="plan"?(this.open&&this.pushOpen(),this.open={frames:[n],verts:e}):this.open?t==="slice"?this.open.frames.push(n):(this.open.frames.push(n),this.open.verts=e,this.pushOpen()):this.open={frames:[n],verts:e}}pushOpen(){this.open&&(this.cycles.push({kind:"sliced",frames:this.open.frames,maxFrameMs:0,verts:this.open.verts}),this.open=null)}noteFrame(t,e){return(this.seg==="A"?this.aTotals:this.bTotals).push(t),this.drains.push(e),this.frame++,!this.finished&&this.seg==="B"&&this.bLeft<=0?(this.finished=!0,this.report()):null}report(){this.open&&this.pushOpen();const t=[...this.aTotals,...this.bTotals],e=l=>l.reduce((c,u)=>Math.max(c,u),0),n=this.windowStart??this.aTotals.length,r=[];this.reason&&r.push(this.reason),this.windowStart===null?r.push("worst chunk never loaded in segment A"):this.windowEnd===null&&r.push("window never closed: no remesh observed before settle");const s=this.cycles[this.cycles.length-1];if(this.windowStart!==null&&this.windowEnd!==null){(!s||s.kind!=="sliced")&&r.push("settled remesh did not take the slice path"),s&&s.verts!==to&&r.push(`settled verts ${s.verts} != node baseline ${to} (light-state drift)`);for(const l of this.cycles)for(const c of l.frames)if(t[c]>xr){r.push(`remesh frame ${c}: ${t[c].toFixed(2)} ms > ${xr} ms`);break}for(let l=this.windowStart;l<=this.windowEnd;l++)if(t[l]>xr){r.push(`window frame ${l}: ${t[l].toFixed(2)} ms > ${xr} ms`);break}}const a=e(this.bTotals);a>qc&&r.push(`ocean max ${a.toFixed(2)} ms > ${qc} ms`);const o=l=>l.map(c=>({...c,maxFrameMs:e(c.frames.map(u=>t[u]))}));return{mode:"remesh",seed:this.opts.seed,phase:this.opts.phase,render:this.opts.render,boot:{frames:n,maxMs:e(this.aTotals.slice(0,n))},worstChunk:{key:pi,settledVerts:s?s.verts:null,window:this.windowStart!==null&&this.windowEnd!==null?[this.windowStart,this.windowEnd]:null,maxWindowMs:this.windowStart!==null&&this.windowEnd!==null?e(t.slice(this.windowStart,this.windowEnd+1)):0,remeshCycles:o(this.cycles)},ocean:{frames:this.bTotals.length,maxMs:a,avgMs:this.bTotals.length?this.bTotals.reduce((l,c)=>l+c,0)/this.bTotals.length:0},global:{maxFrameMs:t[t.reduce((l,c,u)=>c>t[l]?u:l,0)],maxFrameIndex:t.reduce((l,c,u)=>c>t[l]?u:l,0),drainMaxMs:e(this.drains),framesOver16_7:t.map((l,c)=>l>xr?c:-1).filter(l=>l>=0),framesOver25:t.map((l,c)=>l>25?c:-1).filter(l=>l>=0),framesOver33_4:t.map((l,c)=>l>33.4?c:-1).filter(l=>l>=0)},pass:r.length===0,failReason:r.length?r.join("; "):null}}}function Kc(i){const t=new Oe;return t.setAttribute("position",new Me(i.positions,3)),t.setAttribute("color",new Me(i.colors,4)),t.setAttribute("uv",new Me(i.uvs,2)),t.setAttribute("aLight",new Me(i.light,2)),t.setIndex(new Me(i.indices,1)),t.computeBoundingSphere(),t}const D0=5.6,I0=3,U0=13,N0=8,F0=28,O0=9.5,B0=.3,z0=1.8,k0=1.62,Lr=6;function Xo(i,t,e,n,r){const s=(b,A,L)=>typeof i=="function"?i(b,A,L):i.getBlock(b,A,L),a=r??((b,A,L)=>{const T=s(b,A,L);return T!==X.Air&&T!==X.Water});let o=Math.floor(t.x),l=Math.floor(t.y),c=Math.floor(t.z);const u=e.x>=0?1:-1,d=e.y>=0?1:-1,h=e.z>=0?1:-1,m=Math.abs(1/e.x),g=Math.abs(1/e.y),_=Math.abs(1/e.z);let f=e.x>0?(o+1-t.x)*m:e.x<0?(t.x-o)*m:1/0,p=e.y>0?(l+1-t.y)*g:e.y<0?(t.y-l)*g:1/0,S=e.z>0?(c+1-t.z)*_:e.z<0?(t.z-c)*_:1/0,v=0,E=0,w=0;for(;;){if(a(o,l,c))return{x:o,y:l,z:c,nx:v,ny:E,nz:w};if(f<=p&&f<=S){if(f>n)return null;o+=u,f+=m,[v,E,w]=[-u,0,0]}else if(p<=S){if(p>n)return null;l+=d,p+=g,[v,E,w]=[0,-d,0]}else{if(S>n)return null;c+=h,S+=_,[v,E,w]=[0,0,-h]}}}function rh(i,t,e,n){let r=null;for(let s=0;s<e.length;s++){const a=e[s],o=[[i.x,t.x,a.pos.x-a.kind.half,a.pos.x+a.kind.half],[i.y,t.y,a.pos.y,a.pos.y+a.kind.height],[i.z,t.z,a.pos.z-a.kind.half,a.pos.z+a.kind.half]];let l=0,c=n,u=!0;for(const[d,h,m,g]of o)if(Math.abs(h)<1e-8){if(d<m||d>g){u=!1;break}}else{let _=(m-d)/h,f=(g-d)/h;if(_>f&&([_,f]=[f,_]),_>l&&(l=_),f<c&&(c=f),l>c){u=!1;break}}u&&l<=n&&(r===null||l<r.t)&&(r={index:s,t:l})}return r}const Zc=Math.PI/2-.01,Mr={player:{id:"player",half:B0,height:z0,eye:k0,walkSpeed:D0,swimSpeed:I0,jumpVel:O0,flySpeed:U0,flyVSpeed:N0,canFly:!0,canNoclip:!0,canEdit:!0,collides:!0},deer:{id:"deer",half:.45,height:.9,eye:.7,walkSpeed:1.6,swimSpeed:1,jumpVel:8,flySpeed:0,flyVSpeed:0,canFly:!1,canNoclip:!1,canEdit:!1,collides:!0},spectator:{id:"spectator",half:.3,height:1.8,eye:1.62,walkSpeed:8,swimSpeed:5,jumpVel:0,flySpeed:8,flyVSpeed:8,canFly:!0,canNoclip:!0,canEdit:!1,collides:!1}},Dr={forward:0,strafe:0,up:!1,down:!1,yaw:0,pitch:0,primary:!1,secondary:!1},Qi=1e-7,H0=24;function kr(i){return{x:i.pos.x,y:i.pos.y+i.kind.eye,z:i.pos.z}}function Ir(i,t){const e=Math.cos(t);return{x:-Math.sin(i)*e,y:Math.sin(t),z:-Math.cos(i)*e}}function As(i,t,e,n){const r=i.pos,s=i.kind;return t<r.x+s.half&&t+1>r.x-s.half&&e<r.y+s.height&&e+1>r.y&&n<r.z+s.half&&n+1>r.z-s.half}function sh(i,t,e,n,r){const s=t.kind,a=Math.floor(e-s.half),o=Math.floor(e+s.half-Qi),l=Math.floor(n),c=Math.floor(n+s.height-Qi),u=Math.floor(r-s.half),d=Math.floor(r+s.half-Qi);for(let h=l;h<=c;h++)for(let m=u;m<=d;m++)for(let g=a;g<=o;g++)if(i.isSolid(g,h,m))return!0;return!1}function G0(i,t,e,n,r){const s=t.kind,a=Math.floor(e-s.half),o=Math.floor(e+s.half-Qi),l=Math.floor(n),c=Math.floor(n+s.height-Qi),u=Math.floor(r-s.half),d=Math.floor(r+s.half-Qi);for(let h=l;h<=c;h++)for(let m=u;m<=d;m++)for(let g=a;g<=o;g++)if(i.getBlock(g,h,m)===X.Water)return!0;return!1}function jc(i,t,e){const n=Math.sin(i),r=Math.cos(i);let s=-n*t+r*e,a=-r*t-n*e;const o=Math.hypot(s,a);return o>1&&(s/=o,a/=o),{x:s,z:a}}function eo(i,t,e,n){if(n===0)return!1;const r=t.pos,s=l=>sh(i,t,r.x+(e===0?n*l:0),r.y+(e===1?n*l:0),r.z+(e===2?n*l:0));if(!s(1))return e===0?r.x+=n:e===1?r.y+=n:r.z+=n,!1;let a=0,o=1;for(let l=0;l<H0;l++){const c=(a+o)/2;s(c)?o=c:a=c}return e===0?r.x+=n*a:e===1?r.y+=n*a:r.z+=n*a,!0}function V0(i,t,e,n){const r=t.pos,s=t.vel,a=t.kind;if(t.yaw=e.yaw,t.pitch=e.pitch,t.headInWater=i.getBlock(Math.floor(r.x),Math.floor(r.y+a.eye),Math.floor(r.z))===X.Water,t.inWater=t.headInWater||G0(i,t,r.x,r.y,r.z),a.collides&&t.noclip){const c=jc(t.yaw,e.forward,e.strafe);s.x=c.x*a.flySpeed,s.z=c.z*a.flySpeed,s.y=e.up?a.flyVSpeed:e.down?-a.flyVSpeed:0,r.x+=s.x*n,r.y+=s.y*n,r.z+=s.z*n,t.onGround=!1;return}t.fly?s.y=e.up?a.flyVSpeed:e.down?-a.flyVSpeed:0:(s.y-=F0*n,t.inWater?(e.up&&(s.y=Math.min(s.y+30*n,a.swimSpeed)),s.y=Math.max(s.y,-a.swimSpeed*.6)):e.up&&t.onGround&&(s.y=a.jumpVel));const o=t.fly?a.flySpeed:t.inWater?a.swimSpeed:a.walkSpeed,l=jc(t.yaw,e.forward,e.strafe);s.x=l.x*o,s.z=l.z*o,a.collides?(eo(i,t,0,s.x*n),eo(i,t,2,s.z*n),eo(i,t,1,s.y*n)&&(s.y=0),t.onGround=sh(i,t,r.x,r.y-.02,r.z)):(r.x+=s.x*n,r.y+=s.y*n,r.z+=s.z*n,t.onGround=!1)}function ah(i,t){const e=t.springTarget;if(e)return(n,r,s)=>{const a=i.getBlock(n,r,s);return a!==X.Air&&a!==X.Water?!0:a===X.Water&&e(n,r,s)}}function W0(i,t,e){return t>0?0:i>0?1:i<0?2:e>0?3:4}function oh(i,t,e,n){const r=i.getBlock(t,e,n);return r===X.DoorBottom&&i.getBlock(t,e+1,n)===X.DoorTop?[t,e+1,n]:r===X.DoorTop&&i.getBlock(t,e-1,n)===X.DoorBottom?[t,e-1,n]:null}function Jc(i,t,e,n,r){var a,o;const s=oh(i,t,e,n);s&&(i.setBlock(s[0],s[1],s[2],X.Air),(a=r.waterEdit)==null||a.call(r,s[0],s[1],s[2],X.Air),(o=r.onEdit)==null||o.call(r,s[0],s[1],s[2]))}function X0(i,t,e,n,r){var c,u;const s=i.getBlock(t,e,n),a=i.getMeta(t,e,n),o=ju(!ua(a),ul(a),hl(a));i.setBlock(t,e,n,s,o),(c=r.onEdit)==null||c.call(r,t,e,n);const l=oh(i,t,e,n);l&&(i.setBlock(l[0],l[1],l[2],i.getBlock(l[0],l[1],l[2]),o),(u=r.onEdit)==null||u.call(r,l[0],l[1],l[2]))}function q0(i,t,e,n){var a,o,l,c,u,d,h,m,g,_;if(e.toggleFly&&t.kind.canFly&&(t.fly=!t.fly),e.toggleNoclip&&t.kind.canNoclip&&(t.noclip=!t.noclip),!t.kind.canEdit)return;const r=kr(t),s=Ir(t.yaw,t.pitch);if(e.primary){const f=Xo(i,r,s,Lr,ah(i,n));if(!f)return;const p=i.getBlock(f.x,f.y,f.z);Er(p)&&Jc(i,f.x,f.y,f.z,n),i.setBlock(f.x,f.y,f.z,X.Air),(a=n.waterEdit)==null||a.call(n,f.x,f.y,f.z,X.Air),(o=n.onEdit)==null||o.call(n,f.x,f.y,f.z);return}if(e.secondary){const f=Xo(i,r,s,Lr);if(!f)return;const p=i.getBlock(f.x,f.y,f.z),S=f.x+f.nx,v=f.y+f.ny,E=f.z+f.nz;if(v<js||v>=Js)return;const w=i.getBlock(S,v,E),b=e.block??X.Stone;if(Er(p)){X0(i,f.x,f.y,f.z,n);return}if(b===X.Torch){if(w!==X.Air||f.ny<0||!rn(p)||!t.noclip&&As(t,S,v,E))return;i.setBlock(S,v,E,X.Torch,Z_(W0(f.nx,f.ny,f.nz))),(l=n.waterEdit)==null||l.call(n,S,v,E,X.Torch),(c=n.onEdit)==null||c.call(n,S,v,E);return}if(b===X.DoorBottom){if(v+1>=Js)return;const A=i.getBlock(S,v+1,E);if(w!==X.Air&&w!==X.Water||A!==X.Air&&A!==X.Water||!t.noclip&&(As(t,S,v,E)||As(t,S,v+1,E)))return;const L=Ir(t.yaw,t.pitch),T=Math.hypot(L.x,L.z),{axis:x,side:P}=j_(T>=.001?L.x/T:0,T>=.001?L.z/T:0,f.nx,f.nz),z=ju(!1,x,P);i.setBlock(S,v,E,X.DoorBottom,z),i.setBlock(S,v+1,E,X.DoorTop,z),(u=n.waterEdit)==null||u.call(n,S,v,E,X.DoorBottom),(d=n.onEdit)==null||d.call(n,S,v,E),(h=n.waterEdit)==null||h.call(n,S,v+1,E,X.DoorTop),(m=n.onEdit)==null||m.call(n,S,v+1,E);return}if(w!==X.Air&&w!==X.Water&&w!==X.Torch&&!Er(w)||!t.noclip&&As(t,S,v,E))return;Er(w)&&Jc(i,S,v,E,n),i.setBlock(S,v,E,b),(g=n.waterEdit)==null||g.call(n,S,v,E,b),(_=n.onEdit)==null||_.call(n,S,v,E)}}class ml{constructor(t){K(this,"a");this.a=t>>>0}next(){this.a|=0,this.a=this.a+1831565813|0;let t=Math.imul(this.a^this.a>>>15,1|this.a);return t=t+Math.imul(t^this.a>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}state(){return this.a>>>0}restore(t){this.a=t>>>0}}function Y0(i){return(i^1592594996)>>>0}function $0(i,t,e,n,r){const s=-Math.sin(r),a=-Math.cos(r),o=Math.floor(t+s),l=Math.floor(n+a),c=Math.floor(e);return i(o,c,l)===X.Water?"water":i(o,c-1,l)===X.Air&&i(o,c-2,l)===X.Air&&i(o,c-3,l)===X.Air?"drop":null}function K0(i,t,e,n,r){const s=Math.floor(t),a=Math.floor(e),o=Math.floor(n);let l=null;for(let c=-r;c<=r;c++)for(let u=-r;u<=r;u++){const d=s+u,h=o+c;for(let m=a-1;m<=a+1;m++)if(i(d,m,h)===X.Grass&&i(d,m+1,h)===X.Air){const g=u*u+c*c;(!l||g<l.d)&&(l={x:d,z:h,d:g})}}return l?{x:l.x,z:l.z}:null}class ha{constructor(t,e){K(this,"world");K(this,"rand");K(this,"mode","wander");K(this,"ticksLeft",0);K(this,"heading");K(this,"stall",0);K(this,"lastX",0);K(this,"lastZ",0);K(this,"first",!0);this.world=t,this.rand=e,this.heading=e()*Math.PI*2,this.ticksLeft=60+Math.floor(e()*150)}intent(t,e){const n={...Dr,yaw:this.heading,pitch:t.pitch};if(this.first&&(this.lastX=t.pos.x,this.lastZ=t.pos.z,this.first=!1),this.ticksLeft<=0)if(this.mode==="wander")this.mode="idle",this.ticksLeft=30+Math.floor(this.rand()*60);else if(this.mode="wander",this.ticksLeft=60+Math.floor(this.rand()*150),this.rand()<.5){const r=K0(this.world,t.pos.x,t.pos.y,t.pos.z,8);this.heading=r?Math.atan2(-(r.x-t.pos.x),-(r.z-t.pos.z)):this.rand()*Math.PI*2}else this.heading=this.rand()*Math.PI*2;if(this.ticksLeft--,this.mode==="wander"){$0(this.world,t.pos.x,t.pos.y,t.pos.z,this.heading)===null&&(n.forward=1);const r=Math.hypot(t.pos.x-this.lastX,t.pos.z-this.lastZ);n.forward===1&&r<.005?++this.stall>30&&(this.heading=this.rand()*Math.PI*2,this.stall=0):this.stall=0}return this.lastX=t.pos.x,this.lastZ=t.pos.z,n}}function Z0(i){return i instanceof lh?"human":i instanceof Q0?"script":i instanceof ha?"mob":i instanceof en?"idle":"unknown"}class j0{constructor(t,e,n){K(this,"entities",new Map);K(this,"viewedId",0);K(this,"homeId",0);K(this,"ghostId",0);K(this,"respawn",{x:0,y:0,z:0});K(this,"rng");K(this,"onIntent");K(this,"onSpawn");K(this,"onDespawn");K(this,"world");K(this,"hooks");K(this,"nextId",1);this.world=t,this.hooks=e,this.rng=new ml(Y0(n))}all(){const t=[];for(const e of[...this.entities.keys()].sort((n,r)=>n-r))t.push(this.entities.get(e));return t}viewed(){return this.entities.get(this.viewedId)}setViewed(t){this.entities.has(t)&&(this.viewedId=t)}spawn(t,e,n={}){var a;const r=Mr[n.kindId??"player"]??Mr.player,s={id:this.nextId++,kind:r,pos:{...t},vel:{x:0,y:0,z:0},yaw:n.yaw??0,pitch:n.pitch??0,onGround:!1,inWater:!1,headInWater:!1,fly:!1,noclip:!1,controller:e,baseController:n.baseController??e};return this.entities.set(s.id,s),this.viewedId===0&&(this.viewedId=s.id),(a=this.onSpawn)==null||a.call(this,s),s}despawn(t){var n;const e=this.entities.get(t);if(e&&((n=this.onDespawn)==null||n.call(this,e)),this.entities.delete(t),this.viewedId===t){this.viewedId=0;const r=this.entities.keys().next().value;r!==void 0&&(this.viewedId=r)}}chunkLoaded(t){return this.world.hasChunk(xt(t.pos.x),xt(t.pos.y),xt(t.pos.z))}tick(t,e){var n;for(const r of this.all()){if(!this.chunkLoaded(r))continue;const s=r.controller.intent(r,e);(n=this.onIntent)==null||n.call(this,e,r,s),q0(this.world,r,s,this.hooks),V0(this.world,r,s,t)}for(const r of this.all())r.pos.y<js&&(r.kind.id==="player"?(r.pos={...this.respawn},r.vel={x:0,y:0,z:0}):this.despawn(r.id))}toRecord(t){return{id:t.id,kindId:t.kind.id,x:t.pos.x,y:t.pos.y,z:t.pos.z,vx:t.vel.x,vy:t.vel.y,vz:t.vel.z,yaw:t.yaw,pitch:t.pitch,fly:t.fly,noclip:t.noclip,controllerKind:Z0(t.controller)}}entitiesInChunk(t,e,n){return this.all().filter(r=>xt(r.pos.x)===t&&xt(r.pos.y)===e&&xt(r.pos.z)===n)}restoreEntity(t,e){if(this.entities.has(t.id))return null;const n=Mr[t.kindId]??(t.kindId==="dolt"?Mr.deer:Mr.player),r={id:t.id,kind:n,pos:{x:t.x,y:t.y,z:t.z},vel:{x:t.vx,y:t.vy,z:t.vz},yaw:t.yaw,pitch:t.pitch,onGround:!1,inWater:!1,headInWater:!1,fly:t.fly,noclip:t.noclip,controller:e,baseController:e};return this.entities.set(r.id,r),this.nextId=Math.max(this.nextId,r.id+1),r}restoreEntities(t,e){for(const n of t)this.restoreEntity(n,e(n))}}class lh{constructor(t,e=0,n=0){K(this,"keys");K(this,"heldBlock",X.Stone);K(this,"frozen",!1);K(this,"yaw");K(this,"pitch");K(this,"primaryEdge",!1);K(this,"secondaryEdge",!1);K(this,"toggleFlyEdge",!1);K(this,"toggleNoclipEdge",!1);K(this,"selectSlot");this.keys=t,this.yaw=e,this.pitch=n}setLook(t,e){this.yaw=t,this.pitch=e}getLook(){return{yaw:this.yaw,pitch:this.pitch}}mouse(t,e){this.yaw-=t*.0025,this.pitch=Math.max(-Zc,Math.min(Zc,this.pitch-e*.0025))}primary(){this.primaryEdge=!0}secondary(){this.secondaryEdge=!0}toggleFly(){this.toggleFlyEdge=!0}toggleNoclip(){this.toggleNoclipEdge=!0}select(t){this.selectSlot=t}intent(t,e){if(this.frozen)return{forward:0,strafe:0,up:!1,down:!1,yaw:t.yaw,pitch:t.pitch,primary:!1,secondary:!1};const n={forward:(this.keys.has("KeyW")?1:0)-(this.keys.has("KeyS")?1:0),strafe:(this.keys.has("KeyD")?1:0)-(this.keys.has("KeyA")?1:0),up:this.keys.has("Space"),down:this.keys.has("ShiftLeft")||this.keys.has("ShiftRight"),yaw:this.yaw,pitch:this.pitch,primary:this.primaryEdge,secondary:this.secondaryEdge,block:this.heldBlock};return this.toggleFlyEdge&&(n.toggleFly=!0),this.toggleNoclipEdge&&(n.toggleNoclip=!0),this.selectSlot!==void 0&&(n.select=this.selectSlot),this.primaryEdge=!1,this.secondaryEdge=!1,this.toggleFlyEdge=!1,this.toggleNoclipEdge=!1,this.selectSlot=void 0,n}}class en{intent(t,e){return{...Dr,yaw:t.yaw,pitch:t.pitch}}}const J0=i=>Math.max(-1,Math.min(1,i));class Q0{constructor(t,e=!1){K(this,"steps");K(this,"repeat");K(this,"si",0);K(this,"ticksLeft",0);this.steps=t,this.repeat=e,this.beginStep()}ticksFor(t){switch(t.op){case"walkTo":return t.timeout;case"dig":return t.ticks;case"place":return t.ticks;case"wait":return t.ticks;case"lookAt":return 1}}beginStep(){const t=this.steps[this.si];this.ticksLeft=t?this.ticksFor(t):0}nextStep(){if(this.si++,this.si>=this.steps.length)if(this.repeat)this.si=0;else return;this.beginStep()}intent(t,e){const n=this.steps[this.si];if(!n)return{...Dr,yaw:t.yaw,pitch:t.pitch};const r={...Dr,yaw:t.yaw,pitch:t.pitch};switch(n.op){case"walkTo":{const s=n.x-t.pos.x,a=n.z-t.pos.z;Math.hypot(s,a)>.4&&(r.yaw=Math.atan2(-s,-a),r.forward=1);break}case"lookAt":{const s=kr(t),a=n.x-s.x,o=n.y-s.y,l=n.z-s.z,c=Math.hypot(a,o,l)||1,u=a/c,d=o/c,h=l/c;r.yaw=Math.atan2(-u,-h),r.pitch=Math.asin(J0(d));break}case"dig":r.primary=!0;break;case"place":r.secondary=!0,r.block=n.block;break}return this.ticksLeft--,this.ticksLeft<=0&&this.nextStep(),r}}function tv(i,t,e){const n=i.viewed();n&&n.id!==e&&(n.controller=n.baseController);const r=i.entities.get(e);r&&(r.controller=t,i.setViewed(e))}function ev(i,t){if(i.homeId===0)return;const e=i.viewed();e&&e.id!==i.homeId&&(e.controller=e.baseController);const n=i.entities.get(i.homeId);n&&(n.controller=t,i.setViewed(i.homeId))}function nv(i,t){if(i.ghostId===0)return;const e=i.viewed();e&&e.id!==i.ghostId&&(e.controller=e.baseController);const n=i.entities.get(i.ghostId);n&&(n.controller=t,i.setViewed(i.ghostId))}function iv(i,t,e,n){return i(t,e,n)===X.Grass&&i(t,e+1,n)===X.Air&&i(t,e+2,n)===X.Air&&e>=-20&&e<=48}function rv(i,t,e,n,r,s){const a=(l,c,u)=>i.getBlock(l,c,u),o=[];for(let l=0;l<400&&o.length<n;l++){const c=Math.floor(r()*16),u=Math.floor(r()*16),d=t*16+c,h=e*16+u;let m=48;for(;m>=-20&&a(d,m,h)===X.Air;)m--;m>=-20&&iv(a,d,m,h)&&!s(d,m+1,h)&&o.push({x:d+.5,y:m+1,z:h+.5})}return o}function sv(i,t,e,n,r=2){if(t.all().filter(c=>c.kind.id==="deer"&&xt(c.pos.x)===e&&xt(c.pos.z)===n).length>=r)return;const a=(c,u,d)=>i.getBlock(c,u,d),o=(c,u,d)=>t.all().some(h=>h.kind.id==="deer"&&Math.round(h.pos.x)===c&&Math.round(h.pos.z)===d),l=new ml(e*73856093^n*19349663);for(const c of rv(i,e,n,r,()=>l.next(),o)){const u=new ha(a,()=>t.rng.next());t.spawn(c,u,{kindId:"deer",baseController:u})}}function av(){return{phase:0}}function ov(i){return Math.hypot(i.vel.x,i.vel.z)}function lv(i,t,e,n){i.phase+=ov(t)*e*n}function cv(i,t=.5){const e=Math.sin(i.phase)*t;return[e,-e,-e,e].map(n=>n===0?0:n)}const uv=[{name:"body",size:[.5,.5,.9],offset:[0,.55,0]},{name:"head",size:[.35,.35,.4],offset:[0,.78,-.5],head:!0},{name:"legFL",size:[.16,.4,.16],offset:[.28,.2,-.3],leg:0},{name:"legFR",size:[.16,.4,.16],offset:[.28,.2,.3],leg:1},{name:"legBL",size:[.16,.4,.16],offset:[-.28,.2,-.3],leg:2},{name:"legBR",size:[.16,.4,.16],offset:[-.28,.2,.3],leg:3}],hv=[{name:"body",size:[.5,.9,.3],offset:[0,.9,0]},{name:"head",size:[.4,.4,.4],offset:[0,1.5,0],head:!0},{name:"legL",size:[.2,.9,.2],offset:[-.15,.45,0],leg:0},{name:"legR",size:[.2,.9,.2],offset:[.15,.45,0],leg:1}],dv={deer:10124111,player:4157365},fv={deer:6,player:4};function ch(i,t){const e=new ml(t),n=32,r=document.createElement("canvas");r.width=r.height=n;const s=r.getContext("2d"),a=i>>16&255,o=i>>8&255,l=i&255,c=h=>Math.max(0,Math.min(255,h)),u=s.createImageData(n,n);for(let h=0;h<n*n;h++){const m=Math.floor((e.next()-.5)*48);u.data[h*4+0]=c(a+m),u.data[h*4+1]=c(o+m),u.data[h*4+2]=c(l+m),u.data[h*4+3]=255}s.putImageData(u,0,0);const d=new Pr(r);return d.magFilter=Te,d}function pv(i,t){const e=i.id==="deer"?uv:i.id==="player"?hv:null;if(!e)return null;const n=new xi,r=new xi,s=[];for(const a of e){const o=new Fe(new Ti(a.size[0],a.size[1],a.size[2]),t);if(a.head){o.position.set(...a.offset),r.add(o);continue}if(a.leg!==void 0){const l=new xi;l.position.set(0,a.offset[1]+a.size[1]/2,0),o.position.set(a.offset[0],-a.size[1]/2,a.offset[2]),l.add(o),n.add(l),s[a.leg]=l;continue}o.position.set(...a.offset),n.add(o)}return n.add(r),{root:n,head:r,legs:s}}function mv(i,t,e,n=.5){i.root.position.set(t.pos.x,t.pos.y,t.pos.z),i.root.rotation.y=t.yaw,i.head.rotation.x=t.pitch;const r=cv(e,n);for(let s=0;s<i.legs.length;s++)i.legs[s].rotation.x=r[s]??0}const ui=[[1,0],[-1,0],[0,1],[0,-1]],gv=[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0],[0,-1,0]],_v=2e3,Rn=0,Qc={b:X.Air,l:0,s:0,p:0,st:0};class vv{constructor(t){K(this,"world");K(this,"queue",new Set);K(this,"touched",new Set);K(this,"stats",{seeds:0,processes:0,queueAdds:0,equalizeFills:0});K(this,"settling",null);K(this,"editQueue",new Set);K(this,"waiting",new Map);K(this,"springs",new Set);this.world=t}solid(t){return t!==X.Air&&On[t].solid}inBand(t){return t>=js&&t<Js}cellState(t,e,n){if(!this.inBand(e))return Qc;const r=this.world.getChunk(xt(t),xt(e),xt(n));if(!r)return Qc;const s=ie(t-r.cx*16,e-r.cy*16,n-r.cz*16);return{b:r.blocks[s],l:r.wlevel[s],s:r.wsource[s],p:r.wplaced[s],st:r.wstream[s]}}setState(t,e,n,r,s,a,o,l,c=!1){if(!this.inBand(e))return;const u=this.world.getChunk(xt(t),xt(e),xt(n));if(!u)return;const d=ie(t-u.cx*16,e-u.cy*16,n-u.cz*16);u.wlevel[d]=r,u.wsource[d]=s,u.wplaced[d]=o,u.wstream[d]=l,u.blocks[d]!==a&&this.world.setBlock(t,e,n,a,0,c)&&this.touched.add(le(u.cx,u.cy,u.cz))}writeCell(t,e,n,r,s,a,o=0,l=0,c=!1){const u=this.cellState(t,e,n);u.b===a&&u.l===r&&u.s===s&&u.p===o&&u.st===l||(this.setState(t,e,n,r,s,a,o,l,c),this.remark(t,e,n,c))}enqueue(t,e,n){this.queue.add(`${t},${e},${n}`),this.stats.queueAdds++;for(const[r,s]of ui)this.queue.add(`${t+r},${e},${n+s}`);this.queue.add(`${t},${e+1},${n}`),this.queue.add(`${t},${e-1},${n}`)}push(t,e){this.queue.add(t),e&&this.editQueue.add(t)}remark(t,e,n,r){this.push(`${t},${e},${n}`,r);for(const[s,a]of ui)this.push(`${t+s},${e},${n+a}`,r);this.push(`${t},${e+1},${n}`,r),this.push(`${t},${e-1},${n}`,r)}settleSeed(t){const e=t.cx*16,n=t.cy*16,r=t.cz*16;for(let a=0;a<t.blocks.length;a++)t.blocks[a]===X.Water&&(t.wlevel[a]===7&&t.wsource[a]===1||(t.wlevel[a]=7,t.wsource[a]=1,t.wplaced[a]=0,t.wstream[a]=0,this.stats.seeds++));const s=(a,o,l,c,u)=>{const d=this.world.getChunk(a,t.cy,o);return d?d.blocks[ie(l,c,u)]===X.Air:!0};for(let a=0;a<16;a++)for(let o=0;o<16;o++)for(let l=0;l<16;l++){const c=l+o*16+a*256;if(t.blocks[c]!==X.Water)continue;const u=e+l,d=n+a,h=r+o;if(a>0){if(t.blocks[c-256]===X.Air){this.enqueue(u,d,h);continue}}else{const g=this.world.getChunk(t.cx,t.cy-1,t.cz);if(d-1<js||d-1>=Js||!g||g.blocks[ie(l,15,o)]===X.Air){this.enqueue(u,d,h);continue}}let m=!1;(l>0&&t.blocks[c-1]===X.Air||l<15&&t.blocks[c+1]===X.Air||o>0&&t.blocks[c-16]===X.Air||o<15&&t.blocks[c+16]===X.Air||l===0&&s(t.cx-1,t.cz,15,a,o)||l===15&&s(t.cx+1,t.cz,0,a,o)||o===0&&s(t.cx,t.cz-1,l,a,15)||o===15&&s(t.cx,t.cz+1,l,a,0))&&(m=!0),m&&this.enqueue(u,d,h)}}process(t,e,n,r=!1){this.stats.processes++;const s=this.cellState(t,e,n);if(s.b!==X.Water)return;const a=this.world.getChunk(xt(t),xt(e),xt(n));if(a&&!a.settled&&a!==this.settling&&s.l===0&&s.s===0)return;if(s.p===1){this.healSourceBody(t,e,n,r),this.spreadToAir(t,e,n,s.l,r);return}const o=this.cellState(t,e-1,n);if(o.b===X.Air&&e>Rn*16){if(!(e-1<Rn*16||this.world.hasChunk(xt(t),xt(e-1),xt(n)))){this.waiting.set(`${t},${e},${n}`,r);return}let u=this.cellState(t,e+1,n).b===X.Water;if(!u){for(const[d,h]of ui)if(this.cellState(t+d,e,n+h).b===X.Water){u=!0;break}}if(u){this.dropColumn(t,e-1,n,0,0,r),this.push(`${t},${e-1},${n}`,r);return}this.writeCell(t,e,n,0,0,X.Air,0,0,r),this.dropColumn(t,e-1,n,s.s,0,r);return}if(s.s===1)return;if(o.b===X.Water){const c=this.cellState(t,e-2,n);if(!(o.st===1||o.l===7||e-2<Rn*16||this.solid(c.b))){this.writeCell(t,e,n,0,0,X.Air,0,0,r);return}let d=this.cellState(t,e+1,n).b===X.Water;if(!d)for(const[h,m]of ui){const g=this.cellState(t+h,e,n+m);if(g.b===X.Water){if(g.p===1){d=!0;break}if(g.l===7&&g.st===1&&this.cellState(t+h,e+1,n+m).b===X.Water){d=!0;break}}}if(d)return;if(s.st===1){this.writeCell(t,e,n,s.l,s.s,X.Water,s.p,0,r);return}}let l=this.feedLevel(t,e,n,s);if(l===0){this.writeCell(t,e,n,0,0,X.Air,0,0,r),this.push(`${t},${e-1},${n}`,r);return}(l!==s.l||s.st!==0)&&(this.writeCell(t,e,n,l,s.s,X.Water,s.p,0,r),l>s.l&&this.push(`${t},${e-1},${n}`,r)),l>=2&&this.spreadToAir(t,e,n,l,r)}feedLevel(t,e,n,r){if(r.p===1)return 7;const s=this.cellState(t,e+1,n);if(s.b===X.Water&&s.l===7)return 7;const a=new Set([`${t},${e},${n}`]);let o=[`${t},${e},${n}`];for(let l=1;l<=6;l++){const c=[];for(const u of o){const[d,h,m]=u.split(",").map(Number);for(const[g,_,f]of gv){const p=d+g,S=h+_,v=m+f,E=`${p},${S},${v}`;if(a.has(E))continue;a.add(E);const w=this.cellState(p,S,v);if(w.b===X.Water){if(w.p===1||w.s===0&&w.l===7&&S>=e)return 7-l;c.push(E)}}}if(o=c,o.length===0)return 0}return 0}healSourceBody(t,e,n,r=!1){if(e-1>=Rn*16&&this.cellState(t,e-1,n).b===X.Air)for(const[a,o]of ui){const l=this.cellState(t+a,e-1,n+o);if(l.b===X.Water&&l.s===1&&l.p===1){this.spawnSource(t,e-1,n,r);return}}for(const[s,a]of ui){if(this.cellState(t+s,e,n+a).b!==X.Air)continue;const l=this.cellState(t+2*s,e,n+2*a);if(!(l.b===X.Water&&l.s===1&&l.p===1))continue;const c=s!==0?0:1,u=s!==0?1:0,d=this.cellState(t+s+c,e,n+a+u),h=this.cellState(t+s-c,e,n+a-u),m=this.cellState(t+s,e+1,n+a);(d.b===X.Water&&d.s===1||h.b===X.Water&&h.s===1||m.b===X.Water&&m.s===1)&&this.spawnSource(t+s,e,n+a,r)}}spawnSource(t,e,n,r=!1){this.writeCell(t,e,n,7,1,X.Water,1,0,r),this.springs.add(`${t},${e},${n}`)}spreadToAir(t,e,n,r,s=!1){if(!(r<2))for(const[a,o]of ui){const l=t+a,c=n+o;this.cellState(l,e,c).b===X.Air&&this.world.hasChunk(xt(l),xt(e),xt(c))&&this.writeCell(l,e,c,r-1,0,X.Water,0,0,s)}}dropColumn(t,e,n,r=0,s=0,a=!1){let o="connects",l=e;for(let c=e;c>=Rn*16;c--){if(this.cellState(t,c,n).b!==X.Air){o="connects",l=c-1;break}if(c===Rn*16){o="worldfloor",l=c;break}if(!this.world.hasChunk(xt(t),xt(c-1),xt(n))){o="edge",l=c;break}const d=this.cellState(t,c-1,n);if(d.b!==X.Air){if(l=c,d.b===X.Water){const h=this.cellState(t,c-2,n);o=this.solid(h.b)||c-2<Rn*16?"sheet":"deep"}else o="solid";break}}if(o!=="deep"&&!(o==="connects"&&l>=e)){for(let c=e;c>l;c--)this.writeCell(t,c,n,7,r,X.Water,s,1,a);if(o!=="connects"){const c=o==="solid"||o==="worldfloor"?0:1;this.writeCell(t,l,n,7,r,X.Water,s,c,a)}}}tick(t){for(const[n,r]of this.waiting)this.push(n,r);this.waiting.clear();for(const n of this.springs){const[r,s,a]=n.split(",").map(Number);this.cellState(r,s,a).p===1?this.push(n,!0):this.springs.delete(n)}let e=0;for(;e<t;){const n=this.queue.values().next();if(n.done)break;const r=n.value,s=this.editQueue.has(r);this.queue.delete(r),this.editQueue.delete(r);const[a,o,l]=r.split(",").map(Number);this.process(a,o,l,s),e++}return e}settle(t,e,n){const r=this.world.getChunk(t,e,n);if(!r||r.settled)return this.touched;if(e>Rn&&!this.world.hasChunk(t,e-1,n))return this.touched;this.settling=r,this.settleSeed(r);let s=0;for(;this.queue.size>0&&s<_v;){const o=this.queue.values().next();if(o.done)break;const l=o.value,c=this.editQueue.has(l);this.queue.delete(l),this.editQueue.delete(l);const[u,d,h]=l.split(",").map(Number);this.process(u,d,h,c),s++}this.settling=null,r.settled=!0;const a=this.world.getChunk(t,e+1,n);return a&&!a.settled&&this.settle(t,e+1,n),this.touched}restore(t){const e=t.cx*16,n=t.cy*16,r=t.cz*16;for(let s=0;s<t.blocks.length;s++)t.blocks[s]!==X.Water||t.wplaced[s]!==1||this.springs.add(`${e+(s&15)},${n+(s>>8&15)},${r+(s>>4&15)}`);if(t.cy>Rn&&!this.world.hasChunk(t.cx,t.cy-1,t.cz))for(let s=0;s<16;s++)for(let a=0;a<16;a++)t.blocks[ie(s,0,a)]===X.Water&&this.waiting.set(`${e+s},${n},${r+a}`,!1);for(let s=0;s<16;s++)for(let a=0;a<16;a++)for(let o=0;o<16;o++)(s===0||s===15||a===0||a===15||o===0||o===15)&&t.blocks[ie(s,a,o)]===X.Water&&this.remark(e+s,n+a,r+o,!1)}edit(t,e,n,r){if(!this.inBand(e))return;const s=this.world.getChunk(xt(t),xt(e),xt(n));if(!s)return;const a=ie(t-s.cx*16,e-s.cy*16,n-s.cz*16);r===X.Water?(s.wlevel[a]=7,s.wsource[a]=1,s.wplaced[a]=1,this.springs.add(`${t},${e},${n}`)):(s.wlevel[a]=0,s.wsource[a]=0,s.wplaced[a]=0,this.springs.delete(`${t},${e},${n}`)),s.wstream[a]=0,this.remark(t,e,n,!0)}}const xv=240;class Mv{constructor(t=0){K(this,"time",0);K(this,"phaseTotal");K(this,"tick",0);this.phaseTotal=t}get dayPhase(){return this.phaseTotal%1}get day(){return 1+Math.floor(this.phaseTotal+.5)}get hour(){return(12+24*this.dayPhase)%24}advance(t){this.time+=t,this.phaseTotal+=t/xv,this.tick++}snapshot(){return{time:this.time,tick:this.tick,phaseTotal:this.phaseTotal}}restore(t){this.time=t.time,this.tick=t.tick,this.phaseTotal=t.phaseTotal}}const tu=i=>String(i).padStart(2,"0");function Sv(i,t){const e=Math.floor(t)%24,n=Math.floor((t-e)*60+1e-9);return`Day ${i} · ${tu(e)}:${tu(n)}`}function yv(i,t,e){return Math.floor(t/e)>Math.floor(i/e)}function Lt(i){return[parseInt(i.slice(1,3),16)/255,parseInt(i.slice(3,5),16)/255,parseInt(i.slice(5,7),16)/255]}const ws=[{p:0,top:Lt("#3d9ae0"),horizon:Lt("#87ceeb"),airFog:Lt("#cfe8ff"),airFogDens:.004,dim:1,stars:0,waterBg:Lt("#0a2a55"),waterFog:Lt("#0a2a55"),waterFogDens:.35},{p:.22,top:Lt("#6f8fc8"),horizon:Lt("#e8a05c"),airFog:Lt("#d8b8a8"),airFogDens:.0045,dim:1,stars:0,waterBg:Lt("#09244d"),waterFog:Lt("#0a2a55"),waterFogDens:.35},{p:.25,top:Lt("#3a2f66"),horizon:Lt("#d9713f"),airFog:Lt("#6a5570"),airFogDens:.005,dim:.85,stars:.15,waterBg:Lt("#071c3d"),waterFog:Lt("#071c3d"),waterFogDens:.37},{p:.3,top:Lt("#0a0d1e"),horizon:Lt("#232c52"),airFog:Lt("#151d3a"),airFogDens:.0055,dim:.45,stars:.6,waterBg:Lt("#040b18"),waterFog:Lt("#040b18"),waterFogDens:.39},{p:.5,top:Lt("#05070f"),horizon:Lt("#2a3a66"),airFog:Lt("#101a33"),airFogDens:.006,dim:.33,stars:1,waterBg:Lt("#030710"),waterFog:Lt("#04091a"),waterFogDens:.4},{p:.7,top:Lt("#0a0d1e"),horizon:Lt("#232c52"),airFog:Lt("#151d3a"),airFogDens:.0055,dim:.45,stars:.6,waterBg:Lt("#040b18"),waterFog:Lt("#040b18"),waterFogDens:.39},{p:.75,top:Lt("#3a2f66"),horizon:Lt("#d9713f"),airFog:Lt("#6a5570"),airFogDens:.005,dim:.85,stars:.15,waterBg:Lt("#071c3d"),waterFog:Lt("#071c3d"),waterFogDens:.37},{p:.78,top:Lt("#6f8fc8"),horizon:Lt("#e8a05c"),airFog:Lt("#d8b8a8"),airFogDens:.0045,dim:1,stars:0,waterBg:Lt("#09244d"),waterFog:Lt("#0a2a55"),waterFogDens:.35},{p:1,top:Lt("#3d9ae0"),horizon:Lt("#87ceeb"),airFog:Lt("#cfe8ff"),airFogDens:.004,dim:1,stars:0,waterBg:Lt("#0a2a55"),waterFog:Lt("#0a2a55"),waterFogDens:.35}],Mi=(i,t,e)=>i+(t-i)*e,Sr=(i,t,e)=>[Mi(i[0],t[0],e),Mi(i[1],t[1],e),Mi(i[2],t[2],e)],Ev=i=>{const t=i<0?0:i>1?1:i;return t*t*(3-2*t)};function Tv(i){const t=(i%1+1)%1;let e=0;for(let l=0;l<ws.length-1;l++)ws[l].p<=t&&(e=l);const n=ws[e],r=ws[e+1],s=Ev((t-n.p)/(r.p-n.p)),a=[Math.sin(2*Math.PI*t),Math.cos(2*Math.PI*t),0],o=Mi(n.dim,r.dim,s);return{skyTop:Sr(n.top,r.top,s),skyHorizon:Sr(n.horizon,r.horizon,s),airFogColor:Sr(n.airFog,r.airFog,s),airFogDensity:Mi(n.airFogDens,r.airFogDens,s),worldDim:o,dayness:(o-.33)/.67,starAlpha:Mi(n.stars,r.stars,s),sunDir:a,moonDir:[-a[0],-a[1],-a[2]],waterBg:Sr(n.waterBg,r.waterBg,s),waterFogColor:Sr(n.waterFog,r.waterFog,s),waterFogDensity:Mi(n.waterFogDens,r.waterFogDens,s)}}const bv=i=>{let t=i>>>0;return()=>{t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}},eu=i=>`rgb(${Math.round(i[0]*255)},${Math.round(i[1]*255)},${Math.round(i[2]*255)})`,nu=(i,t)=>Math.abs(i[0]-t[0])+Math.abs(i[1]-t[1])+Math.abs(i[2]-t[2]);function Av(i,t,e,n){const r=document.createElement("canvas");r.width=16,r.height=256;const s=r.getContext("2d"),a=new Pr(r),o=(w,b)=>{for(let A=0;A<128;A++){const L=A/127;s.fillStyle=eu([w[0]+(b[0]-w[0])*L,w[1]+(b[1]-w[1])*L,w[2]+(b[2]-w[2])*L]),s.fillRect(0,A,16,1)}s.fillStyle=eu(b),s.fillRect(0,128,16,128)},l=new Fe(new cl(400,32,16),new ni({map:a,side:De,fog:!1,depthWrite:!1}));i.add(l);const c=400,u=new Float32Array(c*3),d=new Float32Array(c*3);{const w=bv(5351294);for(let b=0;b<c;b++){const A=w(),L=w()*Math.PI*2,T=Math.sqrt(1-A*A);u[b*3]=T*Math.cos(L)*360,u[b*3+1]=A*360,u[b*3+2]=T*Math.sin(L)*360;const x=w()<.3;d[b*3]=x?.72:1,d[b*3+1]=x?.78:1,d[b*3+2]=1}}const h=new Oe;h.setAttribute("position",new Me(u,3)),h.setAttribute("color",new Me(d,3));const m=new Ku({size:2,sizeAttenuation:!1,vertexColors:!0,transparent:!0,opacity:0,fog:!1,depthWrite:!1}),g=new X_(h,m);i.add(g);const _=(w,b,A)=>{const L=document.createElement("canvas");L.width=64,L.height=64;const T=L.getContext("2d"),x=T.createRadialGradient(32,32,0,32,32,32);return x.addColorStop(0,w),x.addColorStop(.25,w),x.addColorStop(.5,b),x.addColorStop(1,A),T.fillStyle=x,T.fillRect(0,0,64,64),new Pr(L)},f=new wc(new Ho({map:_("rgba(255,246,205,1)","rgba(255,196,80,0.8)","rgba(255,150,40,0)"),fog:!1,transparent:!0}));f.scale.set(46,46,1),i.add(f);const p=new wc(new Ho({map:_("rgba(244,244,232,1)","rgba(190,198,228,0.7)","rgba(150,160,205,0)"),fog:!1,transparent:!0}));p.scale.set(34,34,1),i.add(p),g.renderOrder=-2,f.renderOrder=-2,p.renderOrder=-2;const S=new N;let v=null,E=null;return{apply(w,b,A){if(b==="water"){i.background=n,i.fog=e,n.setRGB(w.waterBg[0],w.waterBg[1],w.waterBg[2]),e.color.setRGB(w.waterFogColor[0],w.waterFogColor[1],w.waterFogColor[2]),e.density=w.waterFogDensity,l.visible=!1,g.visible=!1,f.visible=!1,p.visible=!1;return}i.background=null,i.fog=t,t.color.setRGB(w.airFogColor[0],w.airFogColor[1],w.airFogColor[2]),t.density=w.airFogDensity,l.visible=!0,l.position.copy(A.position),g.visible=w.starAlpha>.01,m.opacity=w.starAlpha,g.position.copy(A.position),f.position.copy(A.position).addScaledVector(S.set(w.sunDir[0],w.sunDir[1],w.sunDir[2]),380),f.visible=w.sunDir[1]>-.03,p.position.copy(A.position).addScaledVector(S.set(w.moonDir[0],w.moonDir[1],w.moonDir[2]),380),p.visible=w.moonDir[1]>-.03,(v===null||E===null||nu(w.skyTop,v)>.003||nu(w.skyHorizon,E)>.003)&&(o(w.skyTop,w.skyHorizon),a.needsUpdate=!0,v=[...w.skyTop],E=[...w.skyHorizon])}}}const ea=4,hi=128,iu=12,wv=.2,Rv=.05,uh=96,na=2048,Cv=.5,Pv=.45,Lv=37.7,Dv=6033621;function Iv(i){let t=i>>>0;return()=>{t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const Uv=Qu(Iv(Dv));function Nv(i,t,e=0,n=0){return Uv((i+ea/2+e)/iu,(t+ea/2+n)/iu)}function Fv(i,t){const e=Nv(i*ea,t*ea);return e>wv?2:e>Rv?1:0}function Ov(i){return[Cv*i,Pv*i+Lv]}function Bv(i,t,e){const[n,r]=Ov(e);return[(i+n)/na,(t+r)/na]}function zv(i){return i<=uh?-1:1}function kv(i){const t=document.createElement("canvas");t.width=hi,t.height=hi;{const l=t.getContext("2d"),c=l.createImageData(hi,hi);for(let u=0;u<hi;u++)for(let d=0;d<hi;d++){const h=Fv(d,u),m=(u*hi+d)*4;c.data[m]=255,c.data[m+1]=255,c.data[m+2]=255,c.data[m+3]=h===2?255:h===1?153:0}l.putImageData(c,0,0)}const e=new Pr(t);e.wrapS=e.wrapT=Gs,e.magFilter=Te,e.minFilter=Te,e.generateMipmaps=!1;const n=new ni({map:e,transparent:!0,opacity:.7,depthWrite:!1,side:sn,fog:!1}),r=new Br(na,na);r.rotateX(-Math.PI/2);{const l=r.attributes.uv;for(let c=0;c<l.count;c++)l.setY(c,1-l.getY(c))}const s=new Fe(r,n);i.add(s);const a=new Gt(16777215),o=new Gt(7371420);return{update(l,c,u,d,h){s.position.set(l,uh,c),s.renderOrder=zv(u);const[m,g]=Bv(l,c,d);e.offset.set(m,g);const _=Math.max(0,Math.min(1,(1-h)/(1-.33)));n.color.copy(a).lerp(o,_)},setVisible(l){s.visible=l}}}const qo=.12,Hv=512;function Gv(i,t,e){i.stats.pops=e.stats.pops,i.stats.seeds=e.stats.seeds,i.stats.fieldChanges=e.stats.fieldChanges,i.queue=e.queue,i.lastTick=e.tick;for(const n of e.changed){const r=t.getChunk(n.cx,n.cy,n.cz);r&&(r.blight.set(n.blight),r.skylight.set(n.skylight),i.touched.add(le(n.cx,n.cy,n.cz)))}}class Vv{constructor(t,e){K(this,"touched",new Set);K(this,"stats",{pops:0,seeds:0,fieldChanges:0});K(this,"queue",0);K(this,"lastTick",0);K(this,"world");K(this,"worldTime");K(this,"worker");this.world=t,this.worldTime=e,this.worker=new Worker(new URL(""+new URL("light-worker-C1dnrZy_.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.onmessage=n=>Gv(this,t,n.data),this.worker.onerror=n=>{console.error("[light-worker] worker crashed — light updates are frozen",n)}}load(t,e,n){const r=this.world.getChunk(t,e,n);r&&this.worker.postMessage({t:"load",tick:this.worldTime.tick,cx:t,cy:e,cz:n,blocks:r.blocks.slice(),meta:r.meta.slice()})}unload(t,e,n){this.worker.postMessage({t:"unload",tick:this.worldTime.tick,cx:t,cy:e,cz:n})}edit(t,e,n){this.worker.postMessage({t:"edit",tick:this.worldTime.tick,x:t,y:e,z:n,block:this.world.getBlock(t,e,n),meta:this.world.getMeta(t,e,n)})}tick(t){this.worker.postMessage({t:"tick",tick:this.worldTime.tick,budget:t})}}class Wv{constructor(t="block-world",e=2){K(this,"dbp");this.dbp=new Promise((n,r)=>{const s=indexedDB.open(t,e);s.onupgradeneeded=()=>{s.result.objectStoreNames.contains("chunks")||s.result.createObjectStore("chunks"),s.result.objectStoreNames.contains("replays")||s.result.createObjectStore("replays")},s.onsuccess=()=>n(s.result),s.onerror=()=>r(s.error)})}tx(t,e){return this.dbp.then(n=>new Promise((r,s)=>{const a=n.transaction("chunks",t),o=e(a.objectStore("chunks"));o.onsuccess=()=>r(o.result),o.onerror=()=>s(o.error)}))}async get(t){return await this.tx("readonly",n=>n.get(t))??void 0}async put(t,e){await this.tx("readwrite",n=>n.put(e,t))}async putMany(t){t.length!==0&&await this.dbp.then(e=>new Promise((n,r)=>{const s=e.transaction("chunks","readwrite"),a=s.objectStore("chunks");s.oncomplete=()=>n(),s.onerror=()=>r(s.error),s.onabort=()=>r(s.error??new Error("transaction aborted"));try{for(const[o,l]of t)a.put(l,o)}catch(o){s.abort(),r(o)}}))}async delete(t){await this.tx("readwrite",e=>e.delete(t))}async keys(t){return this.tx("readonly",e=>e.getAllKeys(t?IDBKeyRange.bound(t,t+"￿"):void 0))}txReplay(t,e){return this.dbp.then(n=>new Promise((r,s)=>{const a=n.transaction("replays",t),o=e(a.objectStore("replays"));o.onsuccess=()=>r(o.result),o.onerror=()=>s(o.error)}))}async putReplay(t,e){await this.txReplay("readwrite",n=>n.put(e,t))}async getReplay(t){return await this.txReplay("readonly",n=>n.get(t))??void 0}async listReplays(){return this.txReplay("readonly",t=>t.getAll())}}function Xv(i,t){return i?i.forward===t.forward&&i.strafe===t.strafe&&i.up===t.up&&i.down===t.down&&i.yaw===t.yaw&&i.pitch===t.pitch&&i.primary===t.primary&&i.secondary===t.secondary&&(i.select??-1)===(t.select??-1)&&(i.block??-1)===(t.block??-1)&&(i.toggleFly??!1)===(t.toggleFly??!1)&&(i.toggleNoclip??!1)===(t.toggleNoclip??!1):!1}class qv{constructor(t){K(this,"events",[]);K(this,"intents",[]);K(this,"viewed",[]);K(this,"last",new Map);K(this,"lastTick");K(this,"onIntent");this.lastTick=t,this.onIntent=(e,n,r)=>{this.lastTick=e;const s=this.last.get(n.id);Xv(s,r)||(this.intents.push({tick:e,entityId:n.id,intent:{...r}}),this.last.set(n.id,r))}}onViewed(t,e){this.viewed.push({tick:t,id:e})}attach(t){t.onIntent=this.onIntent,t.onSpawn=e=>this.events.push({tick:this.lastTick,type:"spawn",id:e.id,kindId:e.kind.id,pose:t.toRecord(e)}),t.onDespawn=e=>this.events.push({tick:this.lastTick,type:"despawn",id:e.id})}}class Yv{constructor(t){K(this,"idx",0);K(this,"last",null);this.entries=t}intent(t,e){for(;this.idx<this.entries.length&&this.entries[this.idx].tick<=e;)this.last=this.entries[this.idx].intent,this.idx++;return this.last?{...this.last}:{...Dr}}}function $v(i){return new URLSearchParams(i).get("replay")}function Kv(i,t){let e=i.snapshot.meta.viewedEntityId;for(const n of i.viewed??[])if(n.tick<=t)e=n.id;else break;return e}const Zv=document.getElementById("app"),hn=new k_({antialias:!0});hn.setPixelRatio(Math.min(window.devicePixelRatio,2));Zv.append(hn.domElement);const ln=new H_,jv=new Gt(666197),Jv=new ca(13625599,.004),Qv=new ca(666197,.35);hn.setClearColor(1055283);const Ge=new qe(70,1,.1,512),tx=70,ex=62;function hh(){Ge.aspect=window.innerWidth/window.innerHeight,Ge.updateProjectionMatrix(),hn.setSize(window.innerWidth,window.innerHeight)}window.addEventListener("resize",hh);hh();const Hr=document.createElement("canvas");Hr.width=256;Hr.height=256;const Rs=Hr.getContext("2d");function nx(i){let t=i>>>0;return()=>{t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function br(i,t,e,n){i.fillStyle=`rgb(${n[0]|0},${n[1]|0},${n[2]|0})`,i.fillRect(t,e,1,1)}function Cn(i,t,e,n){for(let r=0;r<16;r++)for(let s=0;s<16;s++){const a=(n()-.5)*2*e;br(i,s,r,[t[0]+a,t[1]+a,t[2]+a])}}const ru=[(i,t)=>Cn(i,[92,158,66],24,t),(i,t)=>{Cn(i,[120,86,52],16,t),i.save(),i.beginPath(),i.rect(0,0,16,3),i.clip(),Cn(i,[92,158,66],18,t),i.restore()},(i,t)=>Cn(i,[120,86,52],18,t),(i,t)=>{Cn(i,[112,112,118],14,t),i.fillStyle="rgba(58,58,64,.85)";for(let e=0;e<4;e++)i.fillRect(t()*14|0,t()*16|0,2+(t()*3|0),1)},(i,t)=>Cn(i,[216,204,152],14,t),(i,t)=>{Cn(i,[48,104,196],12,t),i.fillStyle="rgba(130,185,255,.55)";for(let e=0;e<5;e++)i.fillRect(t()*13|0,t()*16|0,3,1)},(i,t)=>{for(let e=0;e<16;e++){const n=e%4<2?[112,78,44]:[98,68,40];for(let r=0;r<16;r++){const s=(t()-.5)*14;br(i,e,r,[n[0]+s,n[1]+s,n[2]+s])}}},(i,t)=>{for(let e=0;e<16;e++)for(let n=0;n<16;n++){const s=Math.max(Math.abs(n-7.5),Math.abs(e-7.5))%3<1.5?[152,112,64]:[114,82,48],a=(t()-.5)*10;br(i,n,e,[s[0]+a,s[1]+a,s[2]+a])}},(i,t)=>Cn(i,[54,118,46],30,t),i=>{i.fillStyle="rgb(196,232,250)",i.fillRect(0,0,16,16),i.fillStyle="rgba(255,255,255,.95)",i.fillRect(0,0,16,1),i.fillRect(0,15,16,1),i.fillRect(0,0,1,16),i.fillRect(15,0,1,16),i.fillStyle="rgba(255,255,255,.55)",i.fillRect(3,3,2,6)},(i,t)=>{for(let e=0;e<16;e++){const n=e%4===3?[70,48,28]:[150,108,62];for(let r=0;r<16;r++){const s=(t()-.5)*14;br(i,r,e,[n[0]+s,n[1]+s,n[2]+s])}}},(i,t)=>{for(let e=0;e<16;e++)for(let n=0;n<16;n++){const r=n<2||n>13?[74,50,28]:[112,78,44],s=(t()-.5)*14;br(i,n,e,[r[0]+s,r[1]+s,r[2]+s])}},i=>{i.fillStyle="rgb(255,150,40)",i.fillRect(3,4,10,10),i.fillStyle="rgb(255,214,80)",i.fillRect(5,6,6,7),i.fillStyle="rgb(255,246,205)",i.fillRect(7,8,2,4)},(i,t)=>{Cn(i,[150,108,62],10,t),i.fillStyle="rgba(70,48,28,.9)",i.fillRect(0,0,16,2),i.fillRect(0,14,16,2),i.fillRect(0,0,2,16),i.fillRect(14,0,2,16),i.fillRect(7,3,2,10),i.fillStyle="rgb(220,200,120)",i.fillRect(11,8,2,2)}];for(let i=0;i<ru.length;i++)Rs.save(),Rs.translate(i%16*16,(i/16|0)*16),ru[i](Rs,nx(24301+i*2654435769)),Rs.restore();const Gr=new Pr(Hr);Gr.magFilter=Te;Gr.minFilter=Te;Gr.generateMipmaps=!1;const gl=new ni({map:Gr,vertexColors:!0}),_l=new ni({map:Gr,vertexColors:!0,transparent:!0,opacity:.85,depthWrite:!1,side:sn}),dh=[];function fh(i){const t={value:1},e={value:qo};i.onBeforeCompile=n=>{n.uniforms.uDayness=t,n.uniforms.uAmbient=e,n.vertexShader=n.vertexShader.replace("#include <common>",`#include <common>
attribute vec2 aLight;
varying vec2 vLight;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	vLight = aLight;`),n.fragmentShader=n.fragmentShader.replace("#include <common>",`#include <common>
uniform float uDayness;
uniform float uAmbient;
varying vec2 vLight;
`).replace("#include <color_fragment>",`// per-vertex light: sky component fades with dayness; block light never does
float bwLight = clamp(max(vLight.x, vLight.y * uDayness), 0.0, 1.0);
diffuseColor.rgb *= uAmbient + (1.0 - uAmbient) * bwLight;
#include <color_fragment>`)},dh.push(t)}fh(gl);fh(_l);const Cs=new URLSearchParams(location.search).get("phase"),ph=Cs!==null&&Cs!==""&&Number.isFinite(+Cs)?+Cs:0,tr=new URLSearchParams(location.search).get("prof")==="remesh",mh=tr&&new URLSearchParams(location.search).has("norender"),me=new Mv(ph),ix=Av(ln,Jv,Qv,jv),su=kv(ln),rx=document.getElementById("clock");let au="";const no=document.getElementById("scrub"),ou=document.getElementById("scrub-label"),Yo=document.getElementById("scrub-quit");Yo.addEventListener("click",()=>{const i=new URL(location.href);i.searchParams.delete("replay"),location.href=i.toString()});const Wt=new J_,vn=new vv(Wt),Ke=new Vv(Wt,me);window.__lightDebug=Ke;const gh={onEdit:(i,t,e)=>{fx(i,t,e),Ke.edit(i,t,e)},waterEdit:(i,t,e,n)=>{vn.edit(i,t,e,n)},springTarget:(i,t,e)=>vn.cellState(i,t,e).p===1},rt=new j0(Wt,gh,xn),_h=i=>i.kindId==="deer"||i.kindId==="dolt"?new ha((t,e,n)=>Wt.getBlock(t,e,n),()=>rt.rng.next()):new en;let Le;try{const i=new Wv;Le=new Oc(i,xn,i)}catch{Le=new Oc(null,xn)}window.__persistDebug=Le;const sx={hasPersisted:()=>!1,syncRecord:()=>{},fetchRecord:()=>Promise.resolve(void 0),onUnload:()=>{},dropPersisted:()=>{}};let Kn=null,ar=!1,Ne=null,lu=null;const io=new Set;let qn,cu=!1;async function vh(i){var s,a,o,l,c;if(cu)return;cu=!0;const t=$v(location.search);if(t){const u=await Le.loadReplay(t);if(u){for(const d of u.snapshot.chunks){Qs(Wt,d);const h=Wt.getChunk(d.cx,d.cy,d.cz);h&&(vn.restore(h),Ke.load(d.cx,d.cy,d.cz),Un.add(le(d.cx,d.cy,d.cz)))}if(rt.rng.restore(u.simPrng),me.restore(u.snapshot.meta.time),lu=d=>new Yv(u.intents.filter(h=>h.entityId===d.id)),rt.restoreEntities(u.snapshot.meta.entities,lu),rt.ghostId=((s=rt.all().find(d=>d.kind.id==="spectator"))==null?void 0:s.id)??0,rt.ghostId===0){const d=rt.viewed()??rt.all()[0];rt.ghostId=rt.spawn({x:d.pos.x,y:d.pos.y+4,z:d.pos.z},new en,{kindId:"spectator",baseController:new en}).id}if(rt.setViewed(u.snapshot.meta.viewedEntityId),!rt.viewed()){const d=rt.all().find(h=>h.kind.id==="player");rt.setViewed(d?d.id:rt.ghostId)}{const d=rt.viewed();d&&we.setLook(d.yaw,d.pitch)}Ne={replay:u,paused:!1},console.log(`[replay] loaded ${u.intents.length} deltas, playing ${u.startTick}..${u.endTick}`),Ko(),requestAnimationFrame(jo);return}console.warn(`[replay] not found: ${t} — starting a fresh world instead`)}for(let u=0;u<=4;u++){let d=Le.syncRecord(0,u,2);if(d||(d=await Le.fetchRecord(0,u,2)),d)Qs(Wt,d,rt,_h),Rr(Wt,0,u,2,0,2),vn.restore(Wt.getChunk(0,u,2)),Ke.load(0,u,2),Un.add(le(0,u,2));else{const h=new eh(xn);nh(Wt,h,0,u,2),Ke.load(0,u,2),Un.add(le(0,u,2))}}const e=6,n=46;let r=79;for(;r>=0&&!rn(Wt.getBlock(e,r,n));)r--;if(qn=new N(e+.5,r+1,n+.5),rt.respawn={x:qn.x,y:qn.y,z:qn.z},i){me.restore(i.time);const u=h=>h.id===i.viewedEntityId?we:h.kindId==="deer"||h.kindId==="dolt"?new ha((m,g,_)=>Wt.getBlock(m,g,_),()=>rt.rng.next()):new en;rt.restoreEntities(i.entities,u),rt.setViewed(i.viewedEntityId);const d=rt.entities.get(i.viewedEntityId);if(d&&d.kind.id==="player"&&(d.baseController=new en),rt.homeId=((a=rt.all().find(h=>h.kind.id==="player"))==null?void 0:a.id)??0,rt.ghostId=((o=rt.all().find(h=>h.kind.id==="spectator"))==null?void 0:o.id)??0,rt.ghostId===0){const h=rt.viewed();rt.ghostId=rt.spawn({x:h.pos.x,y:h.pos.y+4,z:h.pos.z},new en,{kindId:"spectator",baseController:new en}).id}if(i.simPrng!==void 0&&rt.rng.restore(i.simPrng),((c=(l=i.hotbar)==null?void 0:l.slots)==null?void 0:c.length)===9){for(let h=0;h<9;h++)ue.setSlot(h,i.hotbar.slots[h]);ue.select(i.hotbar.selected??0),Wr.forEach((h,m)=>h.classList.toggle("sel",m===ue.selected)),Ml(ue.block)}}else{const u=rt.spawn(qn,we,{yaw:-Math.PI/2,kindId:"player",baseController:new en});rt.setViewed(u.id),rt.homeId=u.id,rt.ghostId=rt.spawn({x:qn.x,y:qn.y+4,z:qn.z},new en,{kindId:"spectator",baseController:new en}).id,ue.select(fa.indexOf(X.Planks))}{const u=rt.viewed();u&&we.setLook(u.yaw,u.pitch)}if(tr){we.frozen=!0;const u=rt.viewed();u&&(u.noclip=!0)}Ee=tr?new L0({seed:xn,phase:i?me.dayPhase:ph,render:!mh,anchor:{x:rt.viewed().pos.x,y:rt.viewed().pos.y,z:rt.viewed().pos.z}}):null,Ko(),requestAnimationFrame(jo)}const ax=window.setTimeout(()=>{console.log("[persistence] boot gate: IDB stalled past 5 s — starting a fresh world (any late meta is dropped)"),vh(null)},5e3);Le.boot().then(i=>{window.clearTimeout(ax),vh(i)});const ia={};for(const[i,t]of Object.entries(dv))ia[i]=new ni({map:ch(t,24301)});const Ps=new Map,ox=document.getElementById("kind");function lx(i){const t=new Set;for(const e of rt.all()){if(t.add(e.id),e.kind.collides===!1)continue;let n=Ps.get(e.id);if(!n){const r=ia[e.kind.id]??(ia[e.kind.id]=new ni({map:ch(8947848,24301)})),s=pv(e.kind,r);if(!s)continue;n={rig:s,anim:av()},Ps.set(e.id,n),ln.add(s.root)}lv(n.anim,e,i,fv[e.kind.id]??4),mv(n.rig,e,n.anim),n.rig.root.visible=e.id!==rt.viewedId}for(const[e,n]of Ps)t.has(e)||(ln.remove(n.rig.root),Ps.delete(e))}function cx(){const i=rt.viewed();ox.textContent=i?`viewing: ${i.kind.id}`:"",xl.classList.toggle("hidden",!i||!i.kind.canEdit),ar?(no.classList.remove("hidden"),ou.textContent="● recording… (R to stop)",Yo.classList.add("hidden")):Ne?(no.classList.remove("hidden"),ou.textContent=`replay ${Ne.paused?"⏸ paused":"▶ playing"}   t ${me.tick} / ${Ne.replay.endTick}`,Yo.classList.remove("hidden")):no.classList.add("hidden")}const ra=new Map,ux=3,pn=new Set,Un=new Set,nn=new R0,Bs=(i,t,e)=>Wt.getLight(i,t,e);function uu(i,t,e,n){const r=i[0]-t,s=i[2]-n;return(r*r+s*s)*100+Math.abs(i[1]-e)}function $o(i,t,e,n){const r=le(i,t,e),s=ra.get(r);for(const l of[s==null?void 0:s.opaque,s==null?void 0:s.trans])l&&(ln.remove(l),l.geometry.dispose());const a={opaque:null,trans:null};n.opaque&&(a.opaque=new Fe(Kc(n.opaque),gl)),n.trans&&(a.trans=new Fe(Kc(n.trans),_l)),a.opaque&&ln.add(a.opaque),a.trans&&ln.add(a.trans),ra.set(r,a);const o=Wt.getChunk(i,t,e);o&&(o.dirty=!1)}function hu(i,t,e){nn.cancel(le(i,t,e)),$o(i,t,e,y0(Wt,i,t,e,Bs))}function hx(i,t,e){nn.cancel(le(i,t,e));const n=le(i,t,e),r=ra.get(n);for(const s of[r==null?void 0:r.opaque,r==null?void 0:r.trans])s&&(ln.remove(s),s.geometry.dispose());ra.delete(n)}let Ee=null,du=0;Ge.rotation.order="YXZ";function Ko(){const i=rt.viewed();i&&(Ge.position.set(i.pos.x,i.pos.y+i.kind.eye,i.pos.z),Ge.rotation.set(i.pitch,i.yaw,0))}new URLSearchParams(location.search).has("dbg")&&(window.__bw={renderer:hn,scene:ln,camera:Ge});const da=new Set,we=new lh(da,0,0);window.addEventListener("keydown",i=>{if(da.add(i.code),i.repeat)return;i.code==="KeyF"&&we.toggleFly(),i.code==="KeyN"&&we.toggleNoclip(),i.code==="KeyR"&&(ar?(xx(),Th()):Ax()),i.code==="KeyE"&&Tx(),i.code==="KeyH"&&bx(),i.code==="KeyC"&&Lx(!Ah),i.code==="KeyP"&&gx();const t=i.code.startsWith("Digit")?i.code.slice(5):i.code.startsWith("Numpad")?i.code.slice(6):"";if(t>="1"&&t<="9"){const e=Number(t)-1;ue.select(e),we.select(e)}});window.addEventListener("keyup",i=>da.delete(i.code));hn.domElement.addEventListener("click",()=>{Mn?Sh():cn?yh():un?Sl():ga()});const dx=document.getElementById("crosshair");document.addEventListener("pointerlockchange",()=>{const i=document.pointerLockElement===hn.domElement;dx.style.display=i?"block":"none",i||da.clear()});document.addEventListener("mousemove",i=>{document.pointerLockElement===hn.domElement&&we.mouse(i.movementX,i.movementY)});const Ln=new W_(new q_(new Ti(1.002,1.002,1.002)),new $u({color:16777215}));Ln.visible=!1;ln.add(Ln);let Zo=!1;document.addEventListener("pointerlockchange",()=>{Zo=document.pointerLockElement===hn.domElement,Zo?(document.addEventListener("mousedown",pu),document.addEventListener("contextmenu",fu)):(document.removeEventListener("mousedown",pu),document.removeEventListener("contextmenu",fu),Ln.visible=!1)});function fu(i){i.preventDefault()}function fx(i,t,e){const n=xt(i),r=xt(t),s=xt(e);hu(n,r,s);const a=i-n*Qt,o=t-r*Qt,l=e-s*Qt,c=[];a===0&&c.push([n-1,r,s]),a===Qt-1&&c.push([n+1,r,s]),l===0&&c.push([n,r,s-1]),l===Qt-1&&c.push([n,r,s+1]),o===0&&c.push([n,r-1,s]),o===Qt-1&&c.push([n,r+1,s]);for(const[u,d,h]of c)Wt.hasChunk(u,d,h)&&hu(u,d,h)}function pu(i){i.button===0?we.primary():i.button===2&&we.secondary()}function px(){const i=rt.viewed();return i?Xo(Wt,kr(i),Ir(i.yaw,i.pitch),Lr,ah(Wt,gh)):null}function mx(){if(!Zo){Ln.visible=!1;return}const i=rt.viewed();if(!i){Ln.visible=!1;return}if(rh(kr(i),Ir(i.yaw,i.pitch),rt.all().filter(n=>n.id!==i.id),Lr)){Ln.visible=!1;return}const e=px();if(!e){Ln.visible=!1;return}Ln.position.set(e.x+.5,e.y+.5,e.z+.5),Ln.visible=!0}function gx(){const i=rt.viewed();if(!i)return;const t=rt.all().filter(n=>n.id!==i.id&&n.id!==rt.ghostId),e=rh(kr(i),Ir(i.yaw,i.pitch),t,Lr);e?tv(rt,we,t[e.index].id):rt.viewedId===rt.homeId?nv(rt,we):ev(rt,we),ar&&Kn&&Kn.onViewed(me.tick,rt.viewedId)}function _x(){return{chunks:[...Wt.allChunks()].map(i=>Wo(i)),meta:{v:2,seed:xn,entities:rt.all().map(i=>rt.toRecord(i)),viewedEntityId:rt.viewedId,time:me.snapshot(),hotbar:{slots:[...ue.slots],selected:ue.selected},simPrng:rt.rng.state()}}}let zs=0,xh=0,ks=null;function vx(){zs=me.tick,xh=rt.rng.state(),ks=_x();const i=new qv(zs);i.attach(rt),Kn=i,ar=!0,Ne=null,console.log(`[replay] recording from tick ${zs} (R to stop)`)}function xx(){if(!Kn||!ar||!ks)return;const i={seed:xn,startTick:zs,endTick:me.tick,simPrng:xh,events:Kn.events,intents:Kn.intents,viewed:Kn.viewed,recordedAt:Date.now(),snapshot:ks},t=`${xn}:replay:${i.startTick}`;Le.saveReplay(t,i),rt.onIntent=rt.onSpawn=rt.onDespawn=void 0,Kn=null,ar=!1,ks=null,console.log(`[replay] saved ${t} — ${i.intents.length} intents, ${i.events.length} events (replay with ?replay=${t})`)}const fa=[...Y_],ue=new u0(fa),Mx=Hr.toDataURL();function vl(i,t,e){i.style.backgroundImage=`url(${Mx})`,i.style.backgroundSize=`${e*16}px ${e*16}px`,i.style.backgroundPosition=K_(t,e),i.title=On[t].name}const xl=document.getElementById("hotbar"),Vr=document.getElementById("palette"),Wr=Array.from(xl.children),Sx=fa.map(i=>{const t=document.createElement("div");t.className="slot";const e=document.createElement("div");e.className="icon",vl(e,i,40);const n=document.createElement("span");return n.className="name",n.textContent=On[i].name,t.append(e,n),t.addEventListener("click",()=>ue.setSlot(ue.selected,i)),Vr.append(t),t}),Ml=i=>{Sx.forEach((t,e)=>t.classList.toggle("sel",fa[e]===i))};Wr.forEach((i,t)=>vl(i,ue.slots[t],40));xl.classList.remove("hidden");Wr.forEach((i,t)=>{const e=document.createElement("span");e.className="num",e.textContent=String(t+1),i.append(e)});ue.onSelectChange=i=>{Wr.forEach((t,e)=>t.classList.toggle("sel",e===i)),Ml(ue.block)};ue.onSlotChange=i=>{vl(Wr[i],ue.slots[i],40),Ml(ue.block)};let Mn=!1,cn=!1,un=!1;const pa=document.getElementById("help"),Mh=document.getElementById("help-hint"),ma=document.getElementById("replays"),ro=document.getElementById("replays-list"),yx=document.getElementById("replays-record");function ga(){const i=hn.domElement.requestPointerLock();i instanceof Promise&&i.catch(()=>{})}function cr(){Mh.classList.toggle("hidden",Mn||cn||un)}function Sh(){Vr.classList.add("hidden"),Mn=!1,cr(),ga()}function Ex(){cn&&(cn=!1,pa.classList.add("hidden")),un&&(un=!1,ma.classList.add("hidden")),Mn=!0,Vr.classList.remove("hidden"),cr(),document.exitPointerLock()}function yh(){pa.classList.add("hidden"),cn=!1,cr(),ga()}function Eh(){Mn&&(Mn=!1,Vr.classList.add("hidden")),un&&(un=!1,ma.classList.add("hidden")),cn=!0,pa.classList.remove("hidden"),cr(),document.exitPointerLock()}function Tx(){Mn?Sh():Ex()}function bx(){cn?yh():Eh()}function Th(){Mn&&(Mn=!1,Vr.classList.add("hidden")),cn&&(cn=!1,pa.classList.add("hidden")),un=!0,ma.classList.remove("hidden"),cr(),document.exitPointerLock(),wx()}function Sl(){ma.classList.add("hidden"),un=!1,cr(),ga()}function Ax(){un?Sl():Th()}function wx(){Le.listReplays().then(i=>{un&&Rx(i)})}function Rx(i){if(ro.replaceChildren(),i.length===0){const e=document.createElement("div");e.className="empty",e.textContent="no recordings yet — press R, then record something",ro.append(e);return}const t=[...i].sort((e,n)=>(n.recordedAt??0)-(e.recordedAt??0));for(const e of t){const n=`${e.seed}:replay:${e.startTick}`,r=document.createElement("div");r.className="row";const s=document.createElement("span");s.className="when",s.textContent=e.recordedAt?new Date(e.recordedAt).toLocaleString():"—";const a=document.createElement("span");a.className="len",a.textContent=`${((e.endTick-e.startTick)*Ar).toFixed(1)} s`;const o=document.createElement("span");o.className="tick",o.textContent=`#${e.startTick}`,r.append(s,a,o),r.addEventListener("click",()=>{const l=new URL(location.href);l.searchParams.set("replay",n),location.href=l.toString()}),ro.append(r)}}yx.addEventListener("click",()=>{vx(),Sl()});Mh.addEventListener("click",()=>{cn||Eh()});window.addEventListener("wheel",i=>{Mn||cn||un||(ue.cycle(i.deltaY>0?1:-1),we.select(ue.selected))},{passive:!0});function Cx(){const i=rt.viewed();if(!i)return;const t=xt(i.pos.x),e=xt(i.pos.z),n=xt(i.pos.y),r=c0(Wt,t,e,n,Ne?sx:Le,rt);for(const s of r.unloaded){hx(s.cx,s.cy,s.cz),Ke.unload(s.cx,s.cy,s.cz),pn.delete(le(s.cx,s.cy,s.cz)),Un.delete(le(s.cx,s.cy,s.cz));for(const a of rt.entitiesInChunk(s.cx,s.cy,s.cz))(a.kind.id==="deer"||a.kind.id==="dolt")&&rt.despawn(a.id)}r.unloaded.length&&!Ne&&Le.saveMeta(bh());for(const s of r.rebuilt)vn.settle(s.cx,s.cy,s.cz),Ke.load(s.cx,s.cy,s.cz),Un.add(le(s.cx,s.cy,s.cz));for(const s of r.rebuilt)sv(Wt,rt,s.cx,s.cz);for(const s of r.restored){const a=Wt.getChunk(s.cx,s.cy,s.cz);vn.restore(a),Ke.load(s.cx,s.cy,s.cz),Un.add(le(s.cx,s.cy,s.cz))}for(const s of r.pending){const a=le(s.cx,s.cy,s.cz);io.has(a)||(io.add(a),Le.fetchRecord(s.cx,s.cy,s.cz).then(o=>{if(io.delete(a),!o){Le.dropPersisted(s.cx,s.cy,s.cz);return}if(!ta(s.cx,s.cz,xt(i.pos.x),xt(i.pos.z))||Wt.hasChunk(s.cx,s.cy,s.cz))return;Qs(Wt,o,rt,_h),Rr(Wt,s.cx,s.cy,s.cz,xt(i.pos.x),xt(i.pos.z));const l=Wt.getChunk(s.cx,s.cy,s.cz);vn.restore(l),Ke.load(s.cx,s.cy,s.cz),Un.add(a)}))}}function bh(){return{v:2,seed:xn,entities:rt.all().map(i=>rt.toRecord(i)),viewedEntityId:rt.viewedId,simPrng:rt.rng.state(),time:me.snapshot(),hotbar:{slots:[...ue.slots],selected:ue.selected}}}const yl=()=>{Ne||(Le.saveLoaded(Wt.allChunks(),bh()),Le.flush())};document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&yl()});window.addEventListener("pagehide",()=>yl());setInterval(()=>yl(),5e3);let sa="air";function Px(){const i=rt.viewed(),t=i!=null&&i.headInWater?"water":"air";t!==sa&&(sa=t,Ge.fov=t==="water"?ex:tx,Ge.updateProjectionMatrix())}let Ah=!1;function Lx(i){Ah=i,gl.wireframe=i,_l.wireframe=i}const Ar=1/60,Dx=30,Ix=1e3;let mu=performance.now(),so=0;function jo(i){const t=tr?performance.now():0;let e=(i-mu)/1e3;mu=i,e>.1&&(e=.1),so+=e;const n=me.tick;for(we.heldBlock=ue.block;so>=Ar;)so-=Ar,!(Ne&&Ne.paused)&&(rt.tick(Ar,me.tick),me.advance(Ar),Ne&&(rt.setViewed(Kv(Ne.replay,me.tick)),me.tick>=Ne.replay.endTick&&(Ne.paused=!0)));if(Cx(),Ee){const h=Wt.getChunk(2,1,0),m=Ee.beginFrame({worstLoaded:h!==void 0,worstSettled:h!==void 0&&!pn.has(pi)&&!nn.has(pi)}).waypoint,g=rt.viewed();g&&(g.pos.x=m.x,g.pos.y=m.y,g.pos.z=m.z,g.vel={x:0,y:0,z:0})}Ke.tick(Hv),yv(n,me.tick,Dx)&&vn.tick(Ix);for(const h of vn.touched)pn.add(h);vn.touched.clear();for(const h of Ke.touched)pn.add(h);Ke.touched.clear(),Un.forEach(h=>pn.add(h)),Un.clear();const r=tr?performance.now():0,s=rt.viewed(),a=xt((s==null?void 0:s.pos.x)??0),o=xt((s==null?void 0:s.pos.y)??0),l=xt((s==null?void 0:s.pos.z)??0),c=nn.inFlightKey();if(c){const[h,m,g]=c.split(",").map(Number);if(Wt.hasChunk(h,m,g)){const _=nn.advance(c),f=Wc(Wt,h,m,g,Bs,_[0],_[1]);nn.store(c,f);const p=nn.finish(c);p?($o(h,m,g,p),c===pi&&(Ee==null||Ee.noteRemesh("merge",bs(p)))):c===pi&&(Ee==null||Ee.noteRemesh("slice",bs(f)))}else nn.cancel(c),pn.delete(c)}else if(pn.size){const h=[...pn].map(m=>m.split(",").map(Number));h.sort((m,g)=>uu(m,a,o,l)-uu(g,a,o,l));for(const[m,g,_]of h.slice(0,ux)){const f=`${m},${g},${_}`;if(!Wt.hasChunk(m,g,_)){pn.delete(f);continue}const p=E0(Wt,m,g,_,Bs,T0);if(pn.delete(f),p.complete)$o(m,g,_,p.mesh),f===pi&&(Ee==null||Ee.noteRemesh("probe-complete",bs(p.mesh)));else{nn.start(f,A0(Wt.getChunk(m,g,_),b0));const[S,v]=nn.advance(f),E=Wc(Wt,m,g,_,Bs,S,v);nn.store(f,E),f===pi&&(Ee==null||Ee.noteRemesh("plan",bs(E)));break}}}du=tr?performance.now()-r:0,Ko(),mx(),lx(e),cx(),Px(),su.setVisible(sa==="air");const u=Tv(me.dayPhase);ix.apply(u,sa,Ge);for(const h of dh)h.value=u.dayness;for(const h of Object.values(ia))h.color.setScalar(qo+(1-qo)*u.dayness);su.update(Ge.position.x,Ge.position.z,Ge.position.y,me.time,u.worldDim);const d=Sv(me.day,me.hour);if(d!==au&&(au=d,rx.textContent=d),mh||hn.render(ln,Ge),Ee){const h=Ee.noteFrame(performance.now()-t,du);h&&(console.log("PROF-RESULT "+JSON.stringify(h)),window.__profResult=h)}requestAnimationFrame(jo)}
