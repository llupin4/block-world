var _m=Object.defineProperty;var vm=(n,e,t)=>e in n?_m(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var B=(n,e,t)=>vm(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Jl="166",ym=0,Gu=1,xm=2,ch=1,Sm=2,Wn=3,Ei=0,Bt=1,En=2,vi=0,Nr=1,Vu=2,Wu=3,Xu=4,Mm=5,Vi=100,Em=101,wm=102,bm=103,Tm=104,Am=200,Rm=201,Cm=202,Pm=203,Jc=204,Qc=205,Lm=206,Im=207,Dm=208,Um=209,Nm=210,Fm=211,km=212,Om=213,Bm=214,zm=0,Hm=1,Gm=2,ha=3,Vm=4,Wm=5,Xm=6,qm=7,lh=0,$m=1,Ym=2,yi=0,Km=1,jm=2,Zm=3,Jm=4,Qm=5,eg=6,tg=7,uh=300,Gr=301,Vr=302,el=303,tl=304,ka=306,pa=1e3,Xi=1001,nl=1002,Ct=1003,ng=1004,fo=1005,wn=1006,ec=1007,qi=1008,Jn=1009,dh=1010,fh=1011,Fs=1012,Ql=1013,er=1014,$n=1015,$s=1016,eu=1017,tu=1018,Wr=1020,hh=35902,ph=1021,mh=1022,bn=1023,gh=1024,_h=1025,Fr=1026,Xr=1027,vh=1028,nu=1029,yh=1030,iu=1031,ru=1033,ea=33776,ta=33777,na=33778,ia=33779,il=35840,rl=35841,sl=35842,ol=35843,al=36196,cl=37492,ll=37496,ul=37808,dl=37809,fl=37810,hl=37811,pl=37812,ml=37813,gl=37814,_l=37815,vl=37816,yl=37817,xl=37818,Sl=37819,Ml=37820,El=37821,ra=36492,wl=36494,bl=36495,xh=36283,Tl=36284,Al=36285,Rl=36286,ig=3200,rg=3201,sg=0,og=1,fi="",In="srgb",Ti="srgb-linear",su="display-p3",Oa="display-p3-linear",ma="linear",lt="srgb",ga="rec709",_a="p3",lr=7680,qu=519,ag=512,cg=513,lg=514,Sh=515,ug=516,dg=517,fg=518,hg=519,Cl=35044,$u="300 es",Yn=2e3,va=2001;class Qr{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const r=this._listeners[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const i=this._listeners[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,e);e.target=null}}}const Pt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],sa=Math.PI/180,Pl=180/Math.PI;function xi(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Pt[n&255]+Pt[n>>8&255]+Pt[n>>16&255]+Pt[n>>24&255]+"-"+Pt[e&255]+Pt[e>>8&255]+"-"+Pt[e>>16&15|64]+Pt[e>>24&255]+"-"+Pt[t&63|128]+Pt[t>>8&255]+"-"+Pt[t>>16&255]+Pt[t>>24&255]+Pt[i&255]+Pt[i>>8&255]+Pt[i>>16&255]+Pt[i>>24&255]).toLowerCase()}function Ht(n,e,t){return Math.max(e,Math.min(t,n))}function pg(n,e){return(n%e+e)%e}function tc(n,e,t){return(1-t)*n+t*e}function Un(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function at(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}class qe{constructor(e=0,t=0){qe.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Ht(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*i-o*r+e.x,this.y=s*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class We{constructor(e,t,i,r,s,o,a,c,l){We.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,c,l)}set(e,t,i,r,s,o,a,c,l){const u=this.elements;return u[0]=e,u[1]=r,u[2]=a,u[3]=t,u[4]=s,u[5]=c,u[6]=i,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[3],c=i[6],l=i[1],u=i[4],f=i[7],d=i[2],p=i[5],g=i[8],_=r[0],h=r[3],m=r[6],v=r[1],y=r[4],S=r[7],b=r[2],E=r[5],A=r[8];return s[0]=o*_+a*v+c*b,s[3]=o*h+a*y+c*E,s[6]=o*m+a*S+c*A,s[1]=l*_+u*v+f*b,s[4]=l*h+u*y+f*E,s[7]=l*m+u*S+f*A,s[2]=d*_+p*v+g*b,s[5]=d*h+p*y+g*E,s[8]=d*m+p*S+g*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-i*s*u+i*a*c+r*s*l-r*o*c}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],f=u*o-a*l,d=a*c-u*s,p=l*s-o*c,g=t*f+i*d+r*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=f*_,e[1]=(r*l-u*i)*_,e[2]=(a*i-r*o)*_,e[3]=d*_,e[4]=(u*t-r*c)*_,e[5]=(r*s-a*t)*_,e[6]=p*_,e[7]=(i*c-l*t)*_,e[8]=(o*t-i*s)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,o,a){const c=Math.cos(s),l=Math.sin(s);return this.set(i*c,i*l,-i*(c*o+l*a)+o+e,-r*l,r*c,-r*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(nc.makeScale(e,t)),this}rotate(e){return this.premultiply(nc.makeRotation(-e)),this}translate(e,t){return this.premultiply(nc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const nc=new We;function Mh(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function ya(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function mg(){const n=ya("canvas");return n.style.display="block",n}const Yu={};function ou(n){n in Yu||(Yu[n]=!0,console.warn(n))}function gg(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}const Ku=new We().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),ju=new We().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),ho={[Ti]:{transfer:ma,primaries:ga,toReference:n=>n,fromReference:n=>n},[In]:{transfer:lt,primaries:ga,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[Oa]:{transfer:ma,primaries:_a,toReference:n=>n.applyMatrix3(ju),fromReference:n=>n.applyMatrix3(Ku)},[su]:{transfer:lt,primaries:_a,toReference:n=>n.convertSRGBToLinear().applyMatrix3(ju),fromReference:n=>n.applyMatrix3(Ku).convertLinearToSRGB()}},_g=new Set([Ti,Oa]),st={enabled:!0,_workingColorSpace:Ti,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!_g.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,e,t){if(this.enabled===!1||e===t||!e||!t)return n;const i=ho[e].toReference,r=ho[t].fromReference;return r(i(n))},fromWorkingColorSpace:function(n,e){return this.convert(n,this._workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this._workingColorSpace)},getPrimaries:function(n){return ho[n].primaries},getTransfer:function(n){return n===fi?ma:ho[n].transfer}};function kr(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function ic(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let ur;class vg{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{ur===void 0&&(ur=ya("canvas")),ur.width=e.width,ur.height=e.height;const i=ur.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=ur}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=ya("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=kr(s[o]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(kr(t[i]/255)*255):t[i]=kr(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let yg=0;class Eh{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:yg++}),this.uuid=xi(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(rc(r[o].image)):s.push(rc(r[o]))}else s=rc(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function rc(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?vg.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let xg=0;class zt extends Qr{constructor(e=zt.DEFAULT_IMAGE,t=zt.DEFAULT_MAPPING,i=Xi,r=Xi,s=wn,o=qi,a=bn,c=Jn,l=zt.DEFAULT_ANISOTROPY,u=fi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:xg++}),this.uuid=xi(),this.name="",this.source=new Eh(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new qe(0,0),this.repeat=new qe(1,1),this.center=new qe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new We,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==uh)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case pa:e.x=e.x-Math.floor(e.x);break;case Xi:e.x=e.x<0?0:1;break;case nl:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case pa:e.y=e.y-Math.floor(e.y);break;case Xi:e.y=e.y<0?0:1;break;case nl:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}zt.DEFAULT_IMAGE=null;zt.DEFAULT_MAPPING=uh;zt.DEFAULT_ANISOTROPY=1;class wt{constructor(e=0,t=0,i=0,r=1){wt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*t+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*t+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*t+o[7]*i+o[11]*r+o[15]*s,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const c=e.elements,l=c[0],u=c[4],f=c[8],d=c[1],p=c[5],g=c[9],_=c[2],h=c[6],m=c[10];if(Math.abs(u-d)<.01&&Math.abs(f-_)<.01&&Math.abs(g-h)<.01){if(Math.abs(u+d)<.1&&Math.abs(f+_)<.1&&Math.abs(g+h)<.1&&Math.abs(l+p+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const y=(l+1)/2,S=(p+1)/2,b=(m+1)/2,E=(u+d)/4,A=(f+_)/4,C=(g+h)/4;return y>S&&y>b?y<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(y),r=E/i,s=A/i):S>b?S<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(S),i=E/r,s=C/r):b<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(b),i=A/s,r=C/s),this.set(i,r,s,t),this}let v=Math.sqrt((h-g)*(h-g)+(f-_)*(f-_)+(d-u)*(d-u));return Math.abs(v)<.001&&(v=1),this.x=(h-g)/v,this.y=(f-_)/v,this.z=(d-u)/v,this.w=Math.acos((l+p+m-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Sg extends Qr{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new wt(0,0,e,t),this.scissorTest=!1,this.viewport=new wt(0,0,e,t);const r={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:wn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);const s=new zt(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];const o=i.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,r=e.textures.length;i<r;i++)this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Eh(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class tr extends Sg{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class wh extends zt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ct,this.minFilter=Ct,this.wrapR=Xi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Mg extends zt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ct,this.minFilter=Ct,this.wrapR=Xi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ys{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,o,a){let c=i[r+0],l=i[r+1],u=i[r+2],f=i[r+3];const d=s[o+0],p=s[o+1],g=s[o+2],_=s[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=u,e[t+3]=f;return}if(a===1){e[t+0]=d,e[t+1]=p,e[t+2]=g,e[t+3]=_;return}if(f!==_||c!==d||l!==p||u!==g){let h=1-a;const m=c*d+l*p+u*g+f*_,v=m>=0?1:-1,y=1-m*m;if(y>Number.EPSILON){const b=Math.sqrt(y),E=Math.atan2(b,m*v);h=Math.sin(h*E)/b,a=Math.sin(a*E)/b}const S=a*v;if(c=c*h+d*S,l=l*h+p*S,u=u*h+g*S,f=f*h+_*S,h===1-a){const b=1/Math.sqrt(c*c+l*l+u*u+f*f);c*=b,l*=b,u*=b,f*=b}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=f}static multiplyQuaternionsFlat(e,t,i,r,s,o){const a=i[r],c=i[r+1],l=i[r+2],u=i[r+3],f=s[o],d=s[o+1],p=s[o+2],g=s[o+3];return e[t]=a*g+u*f+c*p-l*d,e[t+1]=c*g+u*d+l*f-a*p,e[t+2]=l*g+u*p+a*d-c*f,e[t+3]=u*g-a*f-c*d-l*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(i/2),u=a(r/2),f=a(s/2),d=c(i/2),p=c(r/2),g=c(s/2);switch(o){case"XYZ":this._x=d*u*f+l*p*g,this._y=l*p*f-d*u*g,this._z=l*u*g+d*p*f,this._w=l*u*f-d*p*g;break;case"YXZ":this._x=d*u*f+l*p*g,this._y=l*p*f-d*u*g,this._z=l*u*g-d*p*f,this._w=l*u*f+d*p*g;break;case"ZXY":this._x=d*u*f-l*p*g,this._y=l*p*f+d*u*g,this._z=l*u*g+d*p*f,this._w=l*u*f-d*p*g;break;case"ZYX":this._x=d*u*f-l*p*g,this._y=l*p*f+d*u*g,this._z=l*u*g-d*p*f,this._w=l*u*f+d*p*g;break;case"YZX":this._x=d*u*f+l*p*g,this._y=l*p*f+d*u*g,this._z=l*u*g-d*p*f,this._w=l*u*f-d*p*g;break;case"XZY":this._x=d*u*f-l*p*g,this._y=l*p*f-d*u*g,this._z=l*u*g+d*p*f,this._w=l*u*f+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],f=t[10],d=i+a+f;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(u-c)*p,this._y=(s-l)*p,this._z=(o-r)*p}else if(i>a&&i>f){const p=2*Math.sqrt(1+i-a-f);this._w=(u-c)/p,this._x=.25*p,this._y=(r+o)/p,this._z=(s+l)/p}else if(a>f){const p=2*Math.sqrt(1+a-i-f);this._w=(s-l)/p,this._x=(r+o)/p,this._y=.25*p,this._z=(c+u)/p}else{const p=2*Math.sqrt(1+f-i-a);this._w=(o-r)/p,this._x=(s+l)/p,this._y=(c+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ht(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=i*u+o*a+r*l-s*c,this._y=r*u+o*c+s*a-i*l,this._z=s*u+o*l+i*c-r*a,this._w=o*u-i*a-r*c-s*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const i=this._x,r=this._y,s=this._z,o=this._w;let a=o*e._w+i*e._x+r*e._y+s*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=r,this._z=s,this;const c=1-a*a;if(c<=Number.EPSILON){const p=1-t;return this._w=p*o+t*this._w,this._x=p*i+t*this._x,this._y=p*r+t*this._y,this._z=p*s+t*this._z,this.normalize(),this}const l=Math.sqrt(c),u=Math.atan2(l,a),f=Math.sin((1-t)*u)/l,d=Math.sin(t*u)/l;return this._w=o*f+this._w*d,this._x=i*f+this._x*d,this._y=r*f+this._y*d,this._z=s*f+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class W{constructor(e=0,t=0,i=0){W.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Zu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Zu.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,o=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*r-a*i),u=2*(a*t-s*r),f=2*(s*i-o*t);return this.x=t+c*l+o*f-a*u,this.y=i+c*u+a*l-s*f,this.z=r+c*f+s*u-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,o=t.x,a=t.y,c=t.z;return this.x=r*c-s*a,this.y=s*o-i*c,this.z=i*a-r*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return sc.copy(this).projectOnVector(e),this.sub(sc)}reflect(e){return this.sub(sc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Ht(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const sc=new W,Zu=new Ys;class Ks{constructor(e=new W(1/0,1/0,1/0),t=new W(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(gn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(gn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=gn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,gn):gn.fromBufferAttribute(s,o),gn.applyMatrix4(e.matrixWorld),this.expandByPoint(gn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),po.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),po.copy(i.boundingBox)),po.applyMatrix4(e.matrixWorld),this.union(po)}const r=e.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,gn),gn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(is),mo.subVectors(this.max,is),dr.subVectors(e.a,is),fr.subVectors(e.b,is),hr.subVectors(e.c,is),ii.subVectors(fr,dr),ri.subVectors(hr,fr),Pi.subVectors(dr,hr);let t=[0,-ii.z,ii.y,0,-ri.z,ri.y,0,-Pi.z,Pi.y,ii.z,0,-ii.x,ri.z,0,-ri.x,Pi.z,0,-Pi.x,-ii.y,ii.x,0,-ri.y,ri.x,0,-Pi.y,Pi.x,0];return!oc(t,dr,fr,hr,mo)||(t=[1,0,0,0,1,0,0,0,1],!oc(t,dr,fr,hr,mo))?!1:(go.crossVectors(ii,ri),t=[go.x,go.y,go.z],oc(t,dr,fr,hr,mo))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,gn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(gn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Fn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Fn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Fn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Fn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Fn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Fn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Fn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Fn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Fn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Fn=[new W,new W,new W,new W,new W,new W,new W,new W],gn=new W,po=new Ks,dr=new W,fr=new W,hr=new W,ii=new W,ri=new W,Pi=new W,is=new W,mo=new W,go=new W,Li=new W;function oc(n,e,t,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){Li.fromArray(n,s);const a=r.x*Math.abs(Li.x)+r.y*Math.abs(Li.y)+r.z*Math.abs(Li.z),c=e.dot(Li),l=t.dot(Li),u=i.dot(Li);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}const Eg=new Ks,rs=new W,ac=new W;class js{constructor(e=new W,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Eg.setFromPoints(e).getCenter(i);let r=0;for(let s=0,o=e.length;s<o;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;rs.subVectors(e,this.center);const t=rs.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(rs,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ac.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(rs.copy(e.center).add(ac)),this.expandByPoint(rs.copy(e.center).sub(ac))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const kn=new W,cc=new W,_o=new W,si=new W,lc=new W,vo=new W,uc=new W;class au{constructor(e=new W,t=new W(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,kn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=kn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(kn.copy(this.origin).addScaledVector(this.direction,t),kn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){cc.copy(e).add(t).multiplyScalar(.5),_o.copy(t).sub(e).normalize(),si.copy(this.origin).sub(cc);const s=e.distanceTo(t)*.5,o=-this.direction.dot(_o),a=si.dot(this.direction),c=-si.dot(_o),l=si.lengthSq(),u=Math.abs(1-o*o);let f,d,p,g;if(u>0)if(f=o*c-a,d=o*a-c,g=s*u,f>=0)if(d>=-g)if(d<=g){const _=1/u;f*=_,d*=_,p=f*(f+o*d+2*a)+d*(o*f+d+2*c)+l}else d=s,f=Math.max(0,-(o*d+a)),p=-f*f+d*(d+2*c)+l;else d=-s,f=Math.max(0,-(o*d+a)),p=-f*f+d*(d+2*c)+l;else d<=-g?(f=Math.max(0,-(-o*s+a)),d=f>0?-s:Math.min(Math.max(-s,-c),s),p=-f*f+d*(d+2*c)+l):d<=g?(f=0,d=Math.min(Math.max(-s,-c),s),p=d*(d+2*c)+l):(f=Math.max(0,-(o*s+a)),d=f>0?s:Math.min(Math.max(-s,-c),s),p=-f*f+d*(d+2*c)+l);else d=o>0?-s:s,f=Math.max(0,-(o*d+a)),p=-f*f+d*(d+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(cc).addScaledVector(_o,d),p}intersectSphere(e,t){kn.subVectors(e.center,this.origin);const i=kn.dot(this.direction),r=kn.dot(kn)-i*i,s=e.radius*e.radius;if(r>s)return null;const o=Math.sqrt(s-r),a=i-o,c=i+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,o,a,c;const l=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,d=this.origin;return l>=0?(i=(e.min.x-d.x)*l,r=(e.max.x-d.x)*l):(i=(e.max.x-d.x)*l,r=(e.min.x-d.x)*l),u>=0?(s=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(s=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),f>=0?(a=(e.min.z-d.z)*f,c=(e.max.z-d.z)*f):(a=(e.max.z-d.z)*f,c=(e.min.z-d.z)*f),i>c||a>r)||((a>i||i!==i)&&(i=a),(c<r||r!==r)&&(r=c),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,kn)!==null}intersectTriangle(e,t,i,r,s){lc.subVectors(t,e),vo.subVectors(i,e),uc.crossVectors(lc,vo);let o=this.direction.dot(uc),a;if(o>0){if(r)return null;a=1}else if(o<0)a=-1,o=-o;else return null;si.subVectors(this.origin,e);const c=a*this.direction.dot(vo.crossVectors(si,vo));if(c<0)return null;const l=a*this.direction.dot(lc.cross(si));if(l<0||c+l>o)return null;const u=-a*si.dot(uc);return u<0?null:this.at(u/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class mt{constructor(e,t,i,r,s,o,a,c,l,u,f,d,p,g,_,h){mt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,c,l,u,f,d,p,g,_,h)}set(e,t,i,r,s,o,a,c,l,u,f,d,p,g,_,h){const m=this.elements;return m[0]=e,m[4]=t,m[8]=i,m[12]=r,m[1]=s,m[5]=o,m[9]=a,m[13]=c,m[2]=l,m[6]=u,m[10]=f,m[14]=d,m[3]=p,m[7]=g,m[11]=_,m[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new mt().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,r=1/pr.setFromMatrixColumn(e,0).length(),s=1/pr.setFromMatrixColumn(e,1).length(),o=1/pr.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,o=Math.cos(i),a=Math.sin(i),c=Math.cos(r),l=Math.sin(r),u=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){const d=o*u,p=o*f,g=a*u,_=a*f;t[0]=c*u,t[4]=-c*f,t[8]=l,t[1]=p+g*l,t[5]=d-_*l,t[9]=-a*c,t[2]=_-d*l,t[6]=g+p*l,t[10]=o*c}else if(e.order==="YXZ"){const d=c*u,p=c*f,g=l*u,_=l*f;t[0]=d+_*a,t[4]=g*a-p,t[8]=o*l,t[1]=o*f,t[5]=o*u,t[9]=-a,t[2]=p*a-g,t[6]=_+d*a,t[10]=o*c}else if(e.order==="ZXY"){const d=c*u,p=c*f,g=l*u,_=l*f;t[0]=d-_*a,t[4]=-o*f,t[8]=g+p*a,t[1]=p+g*a,t[5]=o*u,t[9]=_-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){const d=o*u,p=o*f,g=a*u,_=a*f;t[0]=c*u,t[4]=g*l-p,t[8]=d*l+_,t[1]=c*f,t[5]=_*l+d,t[9]=p*l-g,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){const d=o*c,p=o*l,g=a*c,_=a*l;t[0]=c*u,t[4]=_-d*f,t[8]=g*f+p,t[1]=f,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=p*f+g,t[10]=d-_*f}else if(e.order==="XZY"){const d=o*c,p=o*l,g=a*c,_=a*l;t[0]=c*u,t[4]=-f,t[8]=l*u,t[1]=d*f+_,t[5]=o*u,t[9]=p*f-g,t[2]=g*f-p,t[6]=a*u,t[10]=_*f+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(wg,e,bg)}lookAt(e,t,i){const r=this.elements;return Yt.subVectors(e,t),Yt.lengthSq()===0&&(Yt.z=1),Yt.normalize(),oi.crossVectors(i,Yt),oi.lengthSq()===0&&(Math.abs(i.z)===1?Yt.x+=1e-4:Yt.z+=1e-4,Yt.normalize(),oi.crossVectors(i,Yt)),oi.normalize(),yo.crossVectors(Yt,oi),r[0]=oi.x,r[4]=yo.x,r[8]=Yt.x,r[1]=oi.y,r[5]=yo.y,r[9]=Yt.y,r[2]=oi.z,r[6]=yo.z,r[10]=Yt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[4],c=i[8],l=i[12],u=i[1],f=i[5],d=i[9],p=i[13],g=i[2],_=i[6],h=i[10],m=i[14],v=i[3],y=i[7],S=i[11],b=i[15],E=r[0],A=r[4],C=r[8],w=r[12],x=r[1],P=r[5],V=r[9],O=r[13],R=r[2],I=r[6],N=r[10],H=r[14],F=r[3],ee=r[7],ne=r[11],U=r[15];return s[0]=o*E+a*x+c*R+l*F,s[4]=o*A+a*P+c*I+l*ee,s[8]=o*C+a*V+c*N+l*ne,s[12]=o*w+a*O+c*H+l*U,s[1]=u*E+f*x+d*R+p*F,s[5]=u*A+f*P+d*I+p*ee,s[9]=u*C+f*V+d*N+p*ne,s[13]=u*w+f*O+d*H+p*U,s[2]=g*E+_*x+h*R+m*F,s[6]=g*A+_*P+h*I+m*ee,s[10]=g*C+_*V+h*N+m*ne,s[14]=g*w+_*O+h*H+m*U,s[3]=v*E+y*x+S*R+b*F,s[7]=v*A+y*P+S*I+b*ee,s[11]=v*C+y*V+S*N+b*ne,s[15]=v*w+y*O+S*H+b*U,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],f=e[6],d=e[10],p=e[14],g=e[3],_=e[7],h=e[11],m=e[15];return g*(+s*c*f-r*l*f-s*a*d+i*l*d+r*a*p-i*c*p)+_*(+t*c*p-t*l*d+s*o*d-r*o*p+r*l*u-s*c*u)+h*(+t*l*f-t*a*p-s*o*f+i*o*p+s*a*u-i*l*u)+m*(-r*a*u-t*c*f+t*a*d+r*o*f-i*o*d+i*c*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],f=e[9],d=e[10],p=e[11],g=e[12],_=e[13],h=e[14],m=e[15],v=f*h*l-_*d*l+_*c*p-a*h*p-f*c*m+a*d*m,y=g*d*l-u*h*l-g*c*p+o*h*p+u*c*m-o*d*m,S=u*_*l-g*f*l+g*a*p-o*_*p-u*a*m+o*f*m,b=g*f*c-u*_*c-g*a*d+o*_*d+u*a*h-o*f*h,E=t*v+i*y+r*S+s*b;if(E===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/E;return e[0]=v*A,e[1]=(_*d*s-f*h*s-_*r*p+i*h*p+f*r*m-i*d*m)*A,e[2]=(a*h*s-_*c*s+_*r*l-i*h*l-a*r*m+i*c*m)*A,e[3]=(f*c*s-a*d*s-f*r*l+i*d*l+a*r*p-i*c*p)*A,e[4]=y*A,e[5]=(u*h*s-g*d*s+g*r*p-t*h*p-u*r*m+t*d*m)*A,e[6]=(g*c*s-o*h*s-g*r*l+t*h*l+o*r*m-t*c*m)*A,e[7]=(o*d*s-u*c*s+u*r*l-t*d*l-o*r*p+t*c*p)*A,e[8]=S*A,e[9]=(g*f*s-u*_*s-g*i*p+t*_*p+u*i*m-t*f*m)*A,e[10]=(o*_*s-g*a*s+g*i*l-t*_*l-o*i*m+t*a*m)*A,e[11]=(u*a*s-o*f*s-u*i*l+t*f*l+o*i*p-t*a*p)*A,e[12]=b*A,e[13]=(u*_*r-g*f*r+g*i*d-t*_*d-u*i*h+t*f*h)*A,e[14]=(g*a*r-o*_*r-g*i*c+t*_*c+o*i*h-t*a*h)*A,e[15]=(o*f*r-u*a*r+u*i*c-t*f*c-o*i*d+t*a*d)*A,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,o=e.x,a=e.y,c=e.z,l=s*o,u=s*a;return this.set(l*o+i,l*a-r*c,l*c+r*a,0,l*a+r*c,u*a+i,u*c-r*o,0,l*c-r*a,u*c+r*o,s*c*c+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,o){return this.set(1,i,s,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,o=t._y,a=t._z,c=t._w,l=s+s,u=o+o,f=a+a,d=s*l,p=s*u,g=s*f,_=o*u,h=o*f,m=a*f,v=c*l,y=c*u,S=c*f,b=i.x,E=i.y,A=i.z;return r[0]=(1-(_+m))*b,r[1]=(p+S)*b,r[2]=(g-y)*b,r[3]=0,r[4]=(p-S)*E,r[5]=(1-(d+m))*E,r[6]=(h+v)*E,r[7]=0,r[8]=(g+y)*A,r[9]=(h-v)*A,r[10]=(1-(d+_))*A,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;let s=pr.set(r[0],r[1],r[2]).length();const o=pr.set(r[4],r[5],r[6]).length(),a=pr.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],_n.copy(this);const l=1/s,u=1/o,f=1/a;return _n.elements[0]*=l,_n.elements[1]*=l,_n.elements[2]*=l,_n.elements[4]*=u,_n.elements[5]*=u,_n.elements[6]*=u,_n.elements[8]*=f,_n.elements[9]*=f,_n.elements[10]*=f,t.setFromRotationMatrix(_n),i.x=s,i.y=o,i.z=a,this}makePerspective(e,t,i,r,s,o,a=Yn){const c=this.elements,l=2*s/(t-e),u=2*s/(i-r),f=(t+e)/(t-e),d=(i+r)/(i-r);let p,g;if(a===Yn)p=-(o+s)/(o-s),g=-2*o*s/(o-s);else if(a===va)p=-o/(o-s),g=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,s,o,a=Yn){const c=this.elements,l=1/(t-e),u=1/(i-r),f=1/(o-s),d=(t+e)*l,p=(i+r)*u;let g,_;if(a===Yn)g=(o+s)*f,_=-2*f;else if(a===va)g=s*f,_=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-d,c[1]=0,c[5]=2*u,c[9]=0,c[13]=-p,c[2]=0,c[6]=0,c[10]=_,c[14]=-g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const pr=new W,_n=new mt,wg=new W(0,0,0),bg=new W(1,1,1),oi=new W,yo=new W,Yt=new W,Ju=new mt,Qu=new Ys;class Qn{constructor(e=0,t=0,i=0,r=Qn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],o=r[4],a=r[8],c=r[1],l=r[5],u=r[9],f=r[2],d=r[6],p=r[10];switch(t){case"XYZ":this._y=Math.asin(Ht(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Ht(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ht(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-f,p),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-Ht(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Ht(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-Ht(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Ju.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ju,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Qu.setFromEuler(this),this.setFromQuaternion(Qu,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Qn.DEFAULT_ORDER="XYZ";class bh{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Tg=0;const ed=new W,mr=new Ys,On=new mt,xo=new W,ss=new W,Ag=new W,Rg=new Ys,td=new W(1,0,0),nd=new W(0,1,0),id=new W(0,0,1),rd={type:"added"},Cg={type:"removed"},gr={type:"childadded",child:null},dc={type:"childremoved",child:null};class Dt extends Qr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Tg++}),this.uuid=xi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Dt.DEFAULT_UP.clone();const e=new W,t=new Qn,i=new Ys,r=new W(1,1,1);function s(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new mt},normalMatrix:{value:new We}}),this.matrix=new mt,this.matrixWorld=new mt,this.matrixAutoUpdate=Dt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new bh,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return mr.setFromAxisAngle(e,t),this.quaternion.multiply(mr),this}rotateOnWorldAxis(e,t){return mr.setFromAxisAngle(e,t),this.quaternion.premultiply(mr),this}rotateX(e){return this.rotateOnAxis(td,e)}rotateY(e){return this.rotateOnAxis(nd,e)}rotateZ(e){return this.rotateOnAxis(id,e)}translateOnAxis(e,t){return ed.copy(e).applyQuaternion(this.quaternion),this.position.add(ed.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(td,e)}translateY(e){return this.translateOnAxis(nd,e)}translateZ(e){return this.translateOnAxis(id,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(On.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?xo.copy(e):xo.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),ss.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?On.lookAt(ss,xo,this.up):On.lookAt(xo,ss,this.up),this.quaternion.setFromRotationMatrix(On),r&&(On.extractRotation(r.matrixWorld),mr.setFromRotationMatrix(On),this.quaternion.premultiply(mr.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(rd),gr.child=e,this.dispatchEvent(gr),gr.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Cg),dc.child=e,this.dispatchEvent(dc),dc.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),On.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),On.multiply(e.parent.matrixWorld)),e.applyMatrix4(On),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(rd),gr.child=e,this.dispatchEvent(gr),gr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ss,e,Ag),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ss,Rg,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const f=c[l];s(e.shapes,f)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(s(e.materials,this.material[c]));r.material=a}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];r.animations.push(s(e.animations,c))}}if(t){const a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),f=o(e.shapes),d=o(e.skeletons),p=o(e.animations),g=o(e.nodes);a.length>0&&(i.geometries=a),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),u.length>0&&(i.images=u),f.length>0&&(i.shapes=f),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=r,i;function o(a){const c=[];for(const l in a){const u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Dt.DEFAULT_UP=new W(0,1,0);Dt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const vn=new W,Bn=new W,fc=new W,zn=new W,_r=new W,vr=new W,sd=new W,hc=new W,pc=new W,mc=new W;class on{constructor(e=new W,t=new W,i=new W){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),vn.subVectors(e,t),r.cross(vn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){vn.subVectors(r,t),Bn.subVectors(i,t),fc.subVectors(e,t);const o=vn.dot(vn),a=vn.dot(Bn),c=vn.dot(fc),l=Bn.dot(Bn),u=Bn.dot(fc),f=o*l-a*a;if(f===0)return s.set(0,0,0),null;const d=1/f,p=(l*c-a*u)*d,g=(o*u-a*c)*d;return s.set(1-p-g,g,p)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,zn)===null?!1:zn.x>=0&&zn.y>=0&&zn.x+zn.y<=1}static getInterpolation(e,t,i,r,s,o,a,c){return this.getBarycoord(e,t,i,r,zn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,zn.x),c.addScaledVector(o,zn.y),c.addScaledVector(a,zn.z),c)}static isFrontFacing(e,t,i,r){return vn.subVectors(i,t),Bn.subVectors(e,t),vn.cross(Bn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return vn.subVectors(this.c,this.b),Bn.subVectors(this.a,this.b),vn.cross(Bn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return on.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return on.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return on.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return on.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return on.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let o,a;_r.subVectors(r,i),vr.subVectors(s,i),hc.subVectors(e,i);const c=_r.dot(hc),l=vr.dot(hc);if(c<=0&&l<=0)return t.copy(i);pc.subVectors(e,r);const u=_r.dot(pc),f=vr.dot(pc);if(u>=0&&f<=u)return t.copy(r);const d=c*f-u*l;if(d<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(i).addScaledVector(_r,o);mc.subVectors(e,s);const p=_r.dot(mc),g=vr.dot(mc);if(g>=0&&p<=g)return t.copy(s);const _=p*l-c*g;if(_<=0&&l>=0&&g<=0)return a=l/(l-g),t.copy(i).addScaledVector(vr,a);const h=u*g-p*f;if(h<=0&&f-u>=0&&p-g>=0)return sd.subVectors(s,r),a=(f-u)/(f-u+(p-g)),t.copy(r).addScaledVector(sd,a);const m=1/(h+_+d);return o=_*m,a=d*m,t.copy(i).addScaledVector(_r,o).addScaledVector(vr,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Th={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ai={h:0,s:0,l:0},So={h:0,s:0,l:0};function gc(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class Ke{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=In){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,st.toWorkingColorSpace(this,t),this}setRGB(e,t,i,r=st.workingColorSpace){return this.r=e,this.g=t,this.b=i,st.toWorkingColorSpace(this,r),this}setHSL(e,t,i,r=st.workingColorSpace){if(e=pg(e,1),t=Ht(t,0,1),i=Ht(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,o=2*i-s;this.r=gc(o,s,e+1/3),this.g=gc(o,s,e),this.b=gc(o,s,e-1/3)}return st.toWorkingColorSpace(this,r),this}setStyle(e,t=In){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=In){const i=Th[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=kr(e.r),this.g=kr(e.g),this.b=kr(e.b),this}copyLinearToSRGB(e){return this.r=ic(e.r),this.g=ic(e.g),this.b=ic(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=In){return st.fromWorkingColorSpace(Lt.copy(this),e),Math.round(Ht(Lt.r*255,0,255))*65536+Math.round(Ht(Lt.g*255,0,255))*256+Math.round(Ht(Lt.b*255,0,255))}getHexString(e=In){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=st.workingColorSpace){st.fromWorkingColorSpace(Lt.copy(this),t);const i=Lt.r,r=Lt.g,s=Lt.b,o=Math.max(i,r,s),a=Math.min(i,r,s);let c,l;const u=(a+o)/2;if(a===o)c=0,l=0;else{const f=o-a;switch(l=u<=.5?f/(o+a):f/(2-o-a),o){case i:c=(r-s)/f+(r<s?6:0);break;case r:c=(s-i)/f+2;break;case s:c=(i-r)/f+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=st.workingColorSpace){return st.fromWorkingColorSpace(Lt.copy(this),t),e.r=Lt.r,e.g=Lt.g,e.b=Lt.b,e}getStyle(e=In){st.fromWorkingColorSpace(Lt.copy(this),e);const t=Lt.r,i=Lt.g,r=Lt.b;return e!==In?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(ai),this.setHSL(ai.h+e,ai.s+t,ai.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ai),e.getHSL(So);const i=tc(ai.h,So.h,t),r=tc(ai.s,So.s,t),s=tc(ai.l,So.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Lt=new Ke;Ke.NAMES=Th;let Pg=0;class rr extends Qr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Pg++}),this.uuid=xi(),this.name="",this.type="Material",this.blending=Nr,this.side=Ei,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Jc,this.blendDst=Qc,this.blendEquation=Vi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ke(0,0,0),this.blendAlpha=0,this.depthFunc=ha,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=qu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=lr,this.stencilZFail=lr,this.stencilZPass=lr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Nr&&(i.blending=this.blending),this.side!==Ei&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Jc&&(i.blendSrc=this.blendSrc),this.blendDst!==Qc&&(i.blendDst=this.blendDst),this.blendEquation!==Vi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==ha&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==qu&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==lr&&(i.stencilFail=this.stencilFail),this.stencilZFail!==lr&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==lr&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const o=[];for(const a in s){const c=s[a];delete c.metadata,o.push(c)}return o}if(t){const s=r(e.textures),o=r(e.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}onBeforeRender(){console.warn("Material: onBeforeRender() has been removed.")}}class Ai extends rr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ke(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Qn,this.combine=lh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const yt=new W,Mo=new qe;class bt{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Cl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=$n,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return ou("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Mo.fromBufferAttribute(this,t),Mo.applyMatrix3(e),this.setXY(t,Mo.x,Mo.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)yt.fromBufferAttribute(this,t),yt.applyMatrix3(e),this.setXYZ(t,yt.x,yt.y,yt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)yt.fromBufferAttribute(this,t),yt.applyMatrix4(e),this.setXYZ(t,yt.x,yt.y,yt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)yt.fromBufferAttribute(this,t),yt.applyNormalMatrix(e),this.setXYZ(t,yt.x,yt.y,yt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)yt.fromBufferAttribute(this,t),yt.transformDirection(e),this.setXYZ(t,yt.x,yt.y,yt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Un(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=at(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Un(t,this.array)),t}setX(e,t){return this.normalized&&(t=at(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Un(t,this.array)),t}setY(e,t){return this.normalized&&(t=at(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Un(t,this.array)),t}setZ(e,t){return this.normalized&&(t=at(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Un(t,this.array)),t}setW(e,t){return this.normalized&&(t=at(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=at(t,this.array),i=at(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=at(t,this.array),i=at(i,this.array),r=at(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=at(t,this.array),i=at(i,this.array),r=at(r,this.array),s=at(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Cl&&(e.usage=this.usage),e}}class Ah extends bt{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Rh extends bt{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class Jt extends bt{constructor(e,t,i){super(new Float32Array(e),t,i)}}let Lg=0;const rn=new mt,_c=new Dt,yr=new W,Kt=new Ks,os=new Ks,Et=new W;class Xt extends Qr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Lg++}),this.uuid=xi(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Mh(e)?Rh:Ah)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new We().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return rn.makeRotationFromQuaternion(e),this.applyMatrix4(rn),this}rotateX(e){return rn.makeRotationX(e),this.applyMatrix4(rn),this}rotateY(e){return rn.makeRotationY(e),this.applyMatrix4(rn),this}rotateZ(e){return rn.makeRotationZ(e),this.applyMatrix4(rn),this}translate(e,t,i){return rn.makeTranslation(e,t,i),this.applyMatrix4(rn),this}scale(e,t,i){return rn.makeScale(e,t,i),this.applyMatrix4(rn),this}lookAt(e){return _c.lookAt(e),_c.updateMatrix(),this.applyMatrix4(_c.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(yr).negate(),this.translate(yr.x,yr.y,yr.z),this}setFromPoints(e){const t=[];for(let i=0,r=e.length;i<r;i++){const s=e[i];t.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new Jt(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ks);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new W(-1/0,-1/0,-1/0),new W(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];Kt.setFromBufferAttribute(s),this.morphTargetsRelative?(Et.addVectors(this.boundingBox.min,Kt.min),this.boundingBox.expandByPoint(Et),Et.addVectors(this.boundingBox.max,Kt.max),this.boundingBox.expandByPoint(Et)):(this.boundingBox.expandByPoint(Kt.min),this.boundingBox.expandByPoint(Kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new js);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new W,1/0);return}if(e){const i=this.boundingSphere.center;if(Kt.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){const a=t[s];os.setFromBufferAttribute(a),this.morphTargetsRelative?(Et.addVectors(Kt.min,os.min),Kt.expandByPoint(Et),Et.addVectors(Kt.max,os.max),Kt.expandByPoint(Et)):(Kt.expandByPoint(os.min),Kt.expandByPoint(os.max))}Kt.getCenter(i);let r=0;for(let s=0,o=e.count;s<o;s++)Et.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Et));if(t)for(let s=0,o=t.length;s<o;s++){const a=t[s],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)Et.fromBufferAttribute(a,l),c&&(yr.fromBufferAttribute(e,l),Et.add(yr)),r=Math.max(r,i.distanceToSquared(Et))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new bt(new Float32Array(4*i.count),4));const o=this.getAttribute("tangent"),a=[],c=[];for(let C=0;C<i.count;C++)a[C]=new W,c[C]=new W;const l=new W,u=new W,f=new W,d=new qe,p=new qe,g=new qe,_=new W,h=new W;function m(C,w,x){l.fromBufferAttribute(i,C),u.fromBufferAttribute(i,w),f.fromBufferAttribute(i,x),d.fromBufferAttribute(s,C),p.fromBufferAttribute(s,w),g.fromBufferAttribute(s,x),u.sub(l),f.sub(l),p.sub(d),g.sub(d);const P=1/(p.x*g.y-g.x*p.y);isFinite(P)&&(_.copy(u).multiplyScalar(g.y).addScaledVector(f,-p.y).multiplyScalar(P),h.copy(f).multiplyScalar(p.x).addScaledVector(u,-g.x).multiplyScalar(P),a[C].add(_),a[w].add(_),a[x].add(_),c[C].add(h),c[w].add(h),c[x].add(h))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let C=0,w=v.length;C<w;++C){const x=v[C],P=x.start,V=x.count;for(let O=P,R=P+V;O<R;O+=3)m(e.getX(O+0),e.getX(O+1),e.getX(O+2))}const y=new W,S=new W,b=new W,E=new W;function A(C){b.fromBufferAttribute(r,C),E.copy(b);const w=a[C];y.copy(w),y.sub(b.multiplyScalar(b.dot(w))).normalize(),S.crossVectors(E,w);const P=S.dot(c[C])<0?-1:1;o.setXYZW(C,y.x,y.y,y.z,P)}for(let C=0,w=v.length;C<w;++C){const x=v[C],P=x.start,V=x.count;for(let O=P,R=P+V;O<R;O+=3)A(e.getX(O+0)),A(e.getX(O+1)),A(e.getX(O+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new bt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);const r=new W,s=new W,o=new W,a=new W,c=new W,l=new W,u=new W,f=new W;if(e)for(let d=0,p=e.count;d<p;d+=3){const g=e.getX(d+0),_=e.getX(d+1),h=e.getX(d+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,_),o.fromBufferAttribute(t,h),u.subVectors(o,s),f.subVectors(r,s),u.cross(f),a.fromBufferAttribute(i,g),c.fromBufferAttribute(i,_),l.fromBufferAttribute(i,h),a.add(u),c.add(u),l.add(u),i.setXYZ(g,a.x,a.y,a.z),i.setXYZ(_,c.x,c.y,c.z),i.setXYZ(h,l.x,l.y,l.z)}else for(let d=0,p=t.count;d<p;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,s),f.subVectors(r,s),u.cross(f),i.setXYZ(d+0,u.x,u.y,u.z),i.setXYZ(d+1,u.x,u.y,u.z),i.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Et.fromBufferAttribute(e,t),Et.normalize(),e.setXYZ(t,Et.x,Et.y,Et.z)}toNonIndexed(){function e(a,c){const l=a.array,u=a.itemSize,f=a.normalized,d=new l.constructor(c.length*u);let p=0,g=0;for(let _=0,h=c.length;_<h;_++){a.isInterleavedBufferAttribute?p=c[_]*a.data.stride+a.offset:p=c[_]*u;for(let m=0;m<u;m++)d[g++]=l[p++]}return new bt(d,u,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Xt,i=this.index.array,r=this.attributes;for(const a in r){const c=r[a],l=e(c,i);t.setAttribute(a,l)}const s=this.morphAttributes;for(const a in s){const c=[],l=s[a];for(let u=0,f=l.length;u<f;u++){const d=l[u],p=e(d,i);c.push(p)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const c in i){const l=i[c];e.data.attributes[c]=l.toJSON(e.data)}const r={};let s=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let f=0,d=l.length;f<d;f++){const p=l[f];u.push(p.toJSON(e.data))}u.length>0&&(r[c]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone(t));const r=e.attributes;for(const l in r){const u=r[l];this.setAttribute(l,u.clone(t))}const s=e.morphAttributes;for(const l in s){const u=[],f=s[l];for(let d=0,p=f.length;d<p;d++)u.push(f[d].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let l=0,u=o.length;l<u;l++){const f=o[l];this.addGroup(f.start,f.count,f.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const od=new mt,Ii=new au,Eo=new js,ad=new W,xr=new W,Sr=new W,Mr=new W,vc=new W,wo=new W,bo=new qe,To=new qe,Ao=new qe,cd=new W,ld=new W,ud=new W,Ro=new W,Co=new W;class Wt extends Dt{constructor(e=new Xt,t=new Ai){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const a=this.morphTargetInfluences;if(s&&a){wo.set(0,0,0);for(let c=0,l=s.length;c<l;c++){const u=a[c],f=s[c];u!==0&&(vc.fromBufferAttribute(f,e),o?wo.addScaledVector(vc,u):wo.addScaledVector(vc.sub(t),u))}t.add(wo)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Eo.copy(i.boundingSphere),Eo.applyMatrix4(s),Ii.copy(e.ray).recast(e.near),!(Eo.containsPoint(Ii.origin)===!1&&(Ii.intersectSphere(Eo,ad)===null||Ii.origin.distanceToSquared(ad)>(e.far-e.near)**2))&&(od.copy(s).invert(),Ii.copy(e.ray).applyMatrix4(od),!(i.boundingBox!==null&&Ii.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Ii)))}_computeIntersections(e,t,i){let r;const s=this.geometry,o=this.material,a=s.index,c=s.attributes.position,l=s.attributes.uv,u=s.attributes.uv1,f=s.attributes.normal,d=s.groups,p=s.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){const h=d[g],m=o[h.materialIndex],v=Math.max(h.start,p.start),y=Math.min(a.count,Math.min(h.start+h.count,p.start+p.count));for(let S=v,b=y;S<b;S+=3){const E=a.getX(S),A=a.getX(S+1),C=a.getX(S+2);r=Po(this,m,e,i,l,u,f,E,A,C),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=h.materialIndex,t.push(r))}}else{const g=Math.max(0,p.start),_=Math.min(a.count,p.start+p.count);for(let h=g,m=_;h<m;h+=3){const v=a.getX(h),y=a.getX(h+1),S=a.getX(h+2);r=Po(this,o,e,i,l,u,f,v,y,S),r&&(r.faceIndex=Math.floor(h/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){const h=d[g],m=o[h.materialIndex],v=Math.max(h.start,p.start),y=Math.min(c.count,Math.min(h.start+h.count,p.start+p.count));for(let S=v,b=y;S<b;S+=3){const E=S,A=S+1,C=S+2;r=Po(this,m,e,i,l,u,f,E,A,C),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=h.materialIndex,t.push(r))}}else{const g=Math.max(0,p.start),_=Math.min(c.count,p.start+p.count);for(let h=g,m=_;h<m;h+=3){const v=h,y=h+1,S=h+2;r=Po(this,o,e,i,l,u,f,v,y,S),r&&(r.faceIndex=Math.floor(h/3),t.push(r))}}}}function Ig(n,e,t,i,r,s,o,a){let c;if(e.side===Bt?c=i.intersectTriangle(o,s,r,!0,a):c=i.intersectTriangle(r,s,o,e.side===Ei,a),c===null)return null;Co.copy(a),Co.applyMatrix4(n.matrixWorld);const l=t.ray.origin.distanceTo(Co);return l<t.near||l>t.far?null:{distance:l,point:Co.clone(),object:n}}function Po(n,e,t,i,r,s,o,a,c,l){n.getVertexPosition(a,xr),n.getVertexPosition(c,Sr),n.getVertexPosition(l,Mr);const u=Ig(n,e,t,i,xr,Sr,Mr,Ro);if(u){r&&(bo.fromBufferAttribute(r,a),To.fromBufferAttribute(r,c),Ao.fromBufferAttribute(r,l),u.uv=on.getInterpolation(Ro,xr,Sr,Mr,bo,To,Ao,new qe)),s&&(bo.fromBufferAttribute(s,a),To.fromBufferAttribute(s,c),Ao.fromBufferAttribute(s,l),u.uv1=on.getInterpolation(Ro,xr,Sr,Mr,bo,To,Ao,new qe)),o&&(cd.fromBufferAttribute(o,a),ld.fromBufferAttribute(o,c),ud.fromBufferAttribute(o,l),u.normal=on.getInterpolation(Ro,xr,Sr,Mr,cd,ld,ud,new W),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const f={a,b:c,c:l,normal:new W,materialIndex:0};on.getNormal(xr,Sr,Mr,f.normal),u.face=f}return u}class sr extends Xt{constructor(e=1,t=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};const a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const c=[],l=[],u=[],f=[];let d=0,p=0;g("z","y","x",-1,-1,i,t,e,o,s,0),g("z","y","x",1,-1,i,t,-e,o,s,1),g("x","z","y",1,1,e,i,t,r,o,2),g("x","z","y",1,-1,e,i,-t,r,o,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(c),this.setAttribute("position",new Jt(l,3)),this.setAttribute("normal",new Jt(u,3)),this.setAttribute("uv",new Jt(f,2));function g(_,h,m,v,y,S,b,E,A,C,w){const x=S/A,P=b/C,V=S/2,O=b/2,R=E/2,I=A+1,N=C+1;let H=0,F=0;const ee=new W;for(let ne=0;ne<N;ne++){const U=ne*P-O;for(let K=0;K<I;K++){const se=K*x-V;ee[_]=se*v,ee[h]=U*y,ee[m]=R,l.push(ee.x,ee.y,ee.z),ee[_]=0,ee[h]=0,ee[m]=E>0?1:-1,u.push(ee.x,ee.y,ee.z),f.push(K/A),f.push(1-ne/C),H+=1}}for(let ne=0;ne<C;ne++)for(let U=0;U<A;U++){const K=d+U+I*ne,se=d+U+I*(ne+1),X=d+(U+1)+I*(ne+1),j=d+(U+1)+I*ne;c.push(K,se,j),c.push(se,X,j),F+=6}a.addGroup(p,F,w),p+=F,d+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new sr(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function qr(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function Nt(n){const e={};for(let t=0;t<n.length;t++){const i=qr(n[t]);for(const r in i)e[r]=i[r]}return e}function Dg(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Ch(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:st.workingColorSpace}const Ug={clone:qr,merge:Nt};var Ng=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Fg=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class wi extends rr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ng,this.fragmentShader=Fg,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=qr(e.uniforms),this.uniformsGroups=Dg(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class Ph extends Dt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new mt,this.projectionMatrix=new mt,this.projectionMatrixInverse=new mt,this.coordinateSystem=Yn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ci=new W,dd=new qe,fd=new qe;class sn extends Ph{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Pl*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(sa*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Pl*2*Math.atan(Math.tan(sa*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ci.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ci.x,ci.y).multiplyScalar(-e/ci.z),ci.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ci.x,ci.y).multiplyScalar(-e/ci.z)}getViewSize(e,t){return this.getViewBounds(e,dd,fd),t.subVectors(fd,dd)}setViewOffset(e,t,i,r,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(sa*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;s+=o.offsetX*r/c,t-=o.offsetY*i/l,r*=o.width/c,i*=o.height/l}const a=this.filmOffset;a!==0&&(s+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Er=-90,wr=1;class kg extends Dt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new sn(Er,wr,e,t);r.layers=this.layers,this.add(r);const s=new sn(Er,wr,e,t);s.layers=this.layers,this.add(s);const o=new sn(Er,wr,e,t);o.layers=this.layers,this.add(o);const a=new sn(Er,wr,e,t);a.layers=this.layers,this.add(a);const c=new sn(Er,wr,e,t);c.layers=this.layers,this.add(c);const l=new sn(Er,wr,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,o,a,c]=t;for(const l of t)this.remove(l);if(e===Yn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===va)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,c,l,u]=this.children,f=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(t,s),e.setRenderTarget(i,1,r),e.render(t,o),e.setRenderTarget(i,2,r),e.render(t,a),e.setRenderTarget(i,3,r),e.render(t,c),e.setRenderTarget(i,4,r),e.render(t,l),i.texture.generateMipmaps=_,e.setRenderTarget(i,5,r),e.render(t,u),e.setRenderTarget(f,d,p),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class Lh extends zt{constructor(e,t,i,r,s,o,a,c,l,u){e=e!==void 0?e:[],t=t!==void 0?t:Gr,super(e,t,i,r,s,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Og extends tr{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Lh(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:wn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new sr(5,5,5),s=new wi({name:"CubemapFromEquirect",uniforms:qr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Bt,blending:vi});s.uniforms.tEquirect.value=t;const o=new Wt(r,s),a=t.minFilter;return t.minFilter===qi&&(t.minFilter=wn),new kg(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,i,r){const s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,r);e.setRenderTarget(s)}}const yc=new W,Bg=new W,zg=new We;class zi{constructor(e=new W(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=yc.subVectors(i,t).cross(Bg.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(yc),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||zg.getNormalMatrix(e),r=this.coplanarPoint(yc).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Di=new js,Lo=new W;class Ih{constructor(e=new zi,t=new zi,i=new zi,r=new zi,s=new zi,o=new zi){this.planes=[e,t,i,r,s,o]}set(e,t,i,r,s,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Yn){const i=this.planes,r=e.elements,s=r[0],o=r[1],a=r[2],c=r[3],l=r[4],u=r[5],f=r[6],d=r[7],p=r[8],g=r[9],_=r[10],h=r[11],m=r[12],v=r[13],y=r[14],S=r[15];if(i[0].setComponents(c-s,d-l,h-p,S-m).normalize(),i[1].setComponents(c+s,d+l,h+p,S+m).normalize(),i[2].setComponents(c+o,d+u,h+g,S+v).normalize(),i[3].setComponents(c-o,d-u,h-g,S-v).normalize(),i[4].setComponents(c-a,d-f,h-_,S-y).normalize(),t===Yn)i[5].setComponents(c+a,d+f,h+_,S+y).normalize();else if(t===va)i[5].setComponents(a,f,_,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Di.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Di.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Di)}intersectsSprite(e){return Di.center.set(0,0,0),Di.radius=.7071067811865476,Di.applyMatrix4(e.matrixWorld),this.intersectsSphere(Di)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Lo.x=r.normal.x>0?e.max.x:e.min.x,Lo.y=r.normal.y>0?e.max.y:e.min.y,Lo.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Lo)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Dh(){let n=null,e=!1,t=null,i=null;function r(s,o){t(s,o),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function Hg(n){const e=new WeakMap;function t(a,c){const l=a.array,u=a.usage,f=l.byteLength,d=n.createBuffer();n.bindBuffer(c,d),n.bufferData(c,l,u),a.onUploadCallback();let p;if(l instanceof Float32Array)p=n.FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(l instanceof Int16Array)p=n.SHORT;else if(l instanceof Uint32Array)p=n.UNSIGNED_INT;else if(l instanceof Int32Array)p=n.INT;else if(l instanceof Int8Array)p=n.BYTE;else if(l instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:p,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:f}}function i(a,c,l){const u=c.array,f=c._updateRange,d=c.updateRanges;if(n.bindBuffer(l,a),f.count===-1&&d.length===0&&n.bufferSubData(l,0,u),d.length!==0){for(let p=0,g=d.length;p<g;p++){const _=d[p];n.bufferSubData(l,_.start*u.BYTES_PER_ELEMENT,u,_.start,_.count)}c.clearUpdateRanges()}f.count!==-1&&(n.bufferSubData(l,f.offset*u.BYTES_PER_ELEMENT,u,f.offset,f.count),f.count=-1),c.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const c=e.get(a);c&&(n.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isGLBufferAttribute){const u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}a.isInterleavedBufferAttribute&&(a=a.data);const l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:r,remove:s,update:o}}class Zs extends Xt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,o=t/2,a=Math.floor(i),c=Math.floor(r),l=a+1,u=c+1,f=e/a,d=t/c,p=[],g=[],_=[],h=[];for(let m=0;m<u;m++){const v=m*d-o;for(let y=0;y<l;y++){const S=y*f-s;g.push(S,-v,0),_.push(0,0,1),h.push(y/a),h.push(1-m/c)}}for(let m=0;m<c;m++)for(let v=0;v<a;v++){const y=v+l*m,S=v+l*(m+1),b=v+1+l*(m+1),E=v+1+l*m;p.push(y,S,E),p.push(S,b,E)}this.setIndex(p),this.setAttribute("position",new Jt(g,3)),this.setAttribute("normal",new Jt(_,3)),this.setAttribute("uv",new Jt(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Zs(e.width,e.height,e.widthSegments,e.heightSegments)}}var Gg=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Vg=`#ifdef USE_ALPHAHASH
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
#endif`,Wg=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Xg=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,qg=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,$g=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Yg=`#ifdef USE_AOMAP
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
#endif`,Kg=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,jg=`#ifdef USE_BATCHING
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
#endif`,Zg=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Jg=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Qg=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,e0=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,t0=`#ifdef USE_IRIDESCENCE
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
#endif`,n0=`#ifdef USE_BUMPMAP
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
#endif`,i0=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,r0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,s0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,o0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,a0=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,c0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,l0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,u0=`#if defined( USE_COLOR_ALPHA )
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
#endif`,d0=`#define PI 3.141592653589793
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
} // validated`,f0=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,h0=`vec3 transformedNormal = objectNormal;
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
#endif`,p0=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,m0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,g0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,_0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,v0="gl_FragColor = linearToOutputTexel( gl_FragColor );",y0=`
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
}`,x0=`#ifdef USE_ENVMAP
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
#endif`,S0=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,M0=`#ifdef USE_ENVMAP
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
#endif`,E0=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,w0=`#ifdef USE_ENVMAP
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
#endif`,b0=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,T0=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,A0=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,R0=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,C0=`#ifdef USE_GRADIENTMAP
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
}`,P0=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,L0=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,I0=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,D0=`uniform bool receiveShadow;
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
#endif`,U0=`#ifdef USE_ENVMAP
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
#endif`,N0=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,F0=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,k0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,O0=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,B0=`PhysicalMaterial material;
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
#endif`,z0=`struct PhysicalMaterial {
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
}`,H0=`
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
#endif`,G0=`#if defined( RE_IndirectDiffuse )
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
#endif`,V0=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,W0=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,X0=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,q0=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$0=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Y0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,K0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,j0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Z0=`#if defined( USE_POINTS_UV )
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
#endif`,J0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Q0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,e_=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,t_=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,n_=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,i_=`#ifdef USE_MORPHTARGETS
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
#endif`,r_=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,s_=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,o_=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,a_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,c_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,l_=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,u_=`#ifdef USE_NORMALMAP
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
#endif`,d_=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,f_=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,h_=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,p_=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,m_=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,g_=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,__=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,v_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,y_=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,x_=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,S_=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,M_=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,E_=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,w_=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,b_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,T_=`float getShadowMask() {
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
}`,A_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,R_=`#ifdef USE_SKINNING
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
#endif`,C_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,P_=`#ifdef USE_SKINNING
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
#endif`,L_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,I_=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,D_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,U_=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,N_=`#ifdef USE_TRANSMISSION
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
#endif`,F_=`#ifdef USE_TRANSMISSION
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
#endif`,k_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,O_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,B_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,z_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const H_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,G_=`uniform sampler2D t2D;
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
}`,V_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,W_=`#ifdef ENVMAP_TYPE_CUBE
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
}`,X_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,q_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$_=`#include <common>
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
}`,Y_=`#if DEPTH_PACKING == 3200
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
}`,K_=`#define DISTANCE
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
}`,j_=`#define DISTANCE
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
}`,Z_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,J_=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Q_=`uniform float scale;
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
}`,ev=`uniform vec3 diffuse;
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
}`,tv=`#include <common>
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
}`,nv=`uniform vec3 diffuse;
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
}`,iv=`#define LAMBERT
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
}`,rv=`#define LAMBERT
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
}`,sv=`#define MATCAP
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
}`,ov=`#define MATCAP
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
}`,av=`#define NORMAL
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
}`,cv=`#define NORMAL
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
}`,lv=`#define PHONG
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
}`,uv=`#define PHONG
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
}`,dv=`#define STANDARD
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
}`,fv=`#define STANDARD
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
}`,hv=`#define TOON
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
}`,pv=`#define TOON
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
}`,mv=`uniform float size;
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
}`,gv=`uniform vec3 diffuse;
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
}`,_v=`#include <common>
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
}`,vv=`uniform vec3 color;
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
}`,yv=`uniform float rotation;
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
}`,xv=`uniform vec3 diffuse;
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
}`,Ve={alphahash_fragment:Gg,alphahash_pars_fragment:Vg,alphamap_fragment:Wg,alphamap_pars_fragment:Xg,alphatest_fragment:qg,alphatest_pars_fragment:$g,aomap_fragment:Yg,aomap_pars_fragment:Kg,batching_pars_vertex:jg,batching_vertex:Zg,begin_vertex:Jg,beginnormal_vertex:Qg,bsdfs:e0,iridescence_fragment:t0,bumpmap_pars_fragment:n0,clipping_planes_fragment:i0,clipping_planes_pars_fragment:r0,clipping_planes_pars_vertex:s0,clipping_planes_vertex:o0,color_fragment:a0,color_pars_fragment:c0,color_pars_vertex:l0,color_vertex:u0,common:d0,cube_uv_reflection_fragment:f0,defaultnormal_vertex:h0,displacementmap_pars_vertex:p0,displacementmap_vertex:m0,emissivemap_fragment:g0,emissivemap_pars_fragment:_0,colorspace_fragment:v0,colorspace_pars_fragment:y0,envmap_fragment:x0,envmap_common_pars_fragment:S0,envmap_pars_fragment:M0,envmap_pars_vertex:E0,envmap_physical_pars_fragment:U0,envmap_vertex:w0,fog_vertex:b0,fog_pars_vertex:T0,fog_fragment:A0,fog_pars_fragment:R0,gradientmap_pars_fragment:C0,lightmap_pars_fragment:P0,lights_lambert_fragment:L0,lights_lambert_pars_fragment:I0,lights_pars_begin:D0,lights_toon_fragment:N0,lights_toon_pars_fragment:F0,lights_phong_fragment:k0,lights_phong_pars_fragment:O0,lights_physical_fragment:B0,lights_physical_pars_fragment:z0,lights_fragment_begin:H0,lights_fragment_maps:G0,lights_fragment_end:V0,logdepthbuf_fragment:W0,logdepthbuf_pars_fragment:X0,logdepthbuf_pars_vertex:q0,logdepthbuf_vertex:$0,map_fragment:Y0,map_pars_fragment:K0,map_particle_fragment:j0,map_particle_pars_fragment:Z0,metalnessmap_fragment:J0,metalnessmap_pars_fragment:Q0,morphinstance_vertex:e_,morphcolor_vertex:t_,morphnormal_vertex:n_,morphtarget_pars_vertex:i_,morphtarget_vertex:r_,normal_fragment_begin:s_,normal_fragment_maps:o_,normal_pars_fragment:a_,normal_pars_vertex:c_,normal_vertex:l_,normalmap_pars_fragment:u_,clearcoat_normal_fragment_begin:d_,clearcoat_normal_fragment_maps:f_,clearcoat_pars_fragment:h_,iridescence_pars_fragment:p_,opaque_fragment:m_,packing:g_,premultiplied_alpha_fragment:__,project_vertex:v_,dithering_fragment:y_,dithering_pars_fragment:x_,roughnessmap_fragment:S_,roughnessmap_pars_fragment:M_,shadowmap_pars_fragment:E_,shadowmap_pars_vertex:w_,shadowmap_vertex:b_,shadowmask_pars_fragment:T_,skinbase_vertex:A_,skinning_pars_vertex:R_,skinning_vertex:C_,skinnormal_vertex:P_,specularmap_fragment:L_,specularmap_pars_fragment:I_,tonemapping_fragment:D_,tonemapping_pars_fragment:U_,transmission_fragment:N_,transmission_pars_fragment:F_,uv_pars_fragment:k_,uv_pars_vertex:O_,uv_vertex:B_,worldpos_vertex:z_,background_vert:H_,background_frag:G_,backgroundCube_vert:V_,backgroundCube_frag:W_,cube_vert:X_,cube_frag:q_,depth_vert:$_,depth_frag:Y_,distanceRGBA_vert:K_,distanceRGBA_frag:j_,equirect_vert:Z_,equirect_frag:J_,linedashed_vert:Q_,linedashed_frag:ev,meshbasic_vert:tv,meshbasic_frag:nv,meshlambert_vert:iv,meshlambert_frag:rv,meshmatcap_vert:sv,meshmatcap_frag:ov,meshnormal_vert:av,meshnormal_frag:cv,meshphong_vert:lv,meshphong_frag:uv,meshphysical_vert:dv,meshphysical_frag:fv,meshtoon_vert:hv,meshtoon_frag:pv,points_vert:mv,points_frag:gv,shadow_vert:_v,shadow_frag:vv,sprite_vert:yv,sprite_frag:xv},ve={common:{diffuse:{value:new Ke(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new We},alphaMap:{value:null},alphaMapTransform:{value:new We},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new We}},envmap:{envMap:{value:null},envMapRotation:{value:new We},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new We}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new We}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new We},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new We},normalScale:{value:new qe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new We},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new We}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new We}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new We}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ke(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ke(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new We},alphaTest:{value:0},uvTransform:{value:new We}},sprite:{diffuse:{value:new Ke(16777215)},opacity:{value:1},center:{value:new qe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new We},alphaMap:{value:null},alphaMapTransform:{value:new We},alphaTest:{value:0}}},Dn={basic:{uniforms:Nt([ve.common,ve.specularmap,ve.envmap,ve.aomap,ve.lightmap,ve.fog]),vertexShader:Ve.meshbasic_vert,fragmentShader:Ve.meshbasic_frag},lambert:{uniforms:Nt([ve.common,ve.specularmap,ve.envmap,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.fog,ve.lights,{emissive:{value:new Ke(0)}}]),vertexShader:Ve.meshlambert_vert,fragmentShader:Ve.meshlambert_frag},phong:{uniforms:Nt([ve.common,ve.specularmap,ve.envmap,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.fog,ve.lights,{emissive:{value:new Ke(0)},specular:{value:new Ke(1118481)},shininess:{value:30}}]),vertexShader:Ve.meshphong_vert,fragmentShader:Ve.meshphong_frag},standard:{uniforms:Nt([ve.common,ve.envmap,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.roughnessmap,ve.metalnessmap,ve.fog,ve.lights,{emissive:{value:new Ke(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag},toon:{uniforms:Nt([ve.common,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.gradientmap,ve.fog,ve.lights,{emissive:{value:new Ke(0)}}]),vertexShader:Ve.meshtoon_vert,fragmentShader:Ve.meshtoon_frag},matcap:{uniforms:Nt([ve.common,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.fog,{matcap:{value:null}}]),vertexShader:Ve.meshmatcap_vert,fragmentShader:Ve.meshmatcap_frag},points:{uniforms:Nt([ve.points,ve.fog]),vertexShader:Ve.points_vert,fragmentShader:Ve.points_frag},dashed:{uniforms:Nt([ve.common,ve.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ve.linedashed_vert,fragmentShader:Ve.linedashed_frag},depth:{uniforms:Nt([ve.common,ve.displacementmap]),vertexShader:Ve.depth_vert,fragmentShader:Ve.depth_frag},normal:{uniforms:Nt([ve.common,ve.bumpmap,ve.normalmap,ve.displacementmap,{opacity:{value:1}}]),vertexShader:Ve.meshnormal_vert,fragmentShader:Ve.meshnormal_frag},sprite:{uniforms:Nt([ve.sprite,ve.fog]),vertexShader:Ve.sprite_vert,fragmentShader:Ve.sprite_frag},background:{uniforms:{uvTransform:{value:new We},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ve.background_vert,fragmentShader:Ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new We}},vertexShader:Ve.backgroundCube_vert,fragmentShader:Ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ve.cube_vert,fragmentShader:Ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ve.equirect_vert,fragmentShader:Ve.equirect_frag},distanceRGBA:{uniforms:Nt([ve.common,ve.displacementmap,{referencePosition:{value:new W},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ve.distanceRGBA_vert,fragmentShader:Ve.distanceRGBA_frag},shadow:{uniforms:Nt([ve.lights,ve.fog,{color:{value:new Ke(0)},opacity:{value:1}}]),vertexShader:Ve.shadow_vert,fragmentShader:Ve.shadow_frag}};Dn.physical={uniforms:Nt([Dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new We},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new We},clearcoatNormalScale:{value:new qe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new We},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new We},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new We},sheen:{value:0},sheenColor:{value:new Ke(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new We},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new We},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new We},transmissionSamplerSize:{value:new qe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new We},attenuationDistance:{value:0},attenuationColor:{value:new Ke(0)},specularColor:{value:new Ke(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new We},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new We},anisotropyVector:{value:new qe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new We}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag};const Io={r:0,b:0,g:0},Ui=new Qn,Sv=new mt;function Mv(n,e,t,i,r,s,o){const a=new Ke(0);let c=s===!0?0:1,l,u,f=null,d=0,p=null;function g(v){let y=v.isScene===!0?v.background:null;return y&&y.isTexture&&(y=(v.backgroundBlurriness>0?t:e).get(y)),y}function _(v){let y=!1;const S=g(v);S===null?m(a,c):S&&S.isColor&&(m(S,1),y=!0);const b=n.xr.getEnvironmentBlendMode();b==="additive"?i.buffers.color.setClear(0,0,0,1,o):b==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||y)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function h(v,y){const S=g(y);S&&(S.isCubeTexture||S.mapping===ka)?(u===void 0&&(u=new Wt(new sr(1,1,1),new wi({name:"BackgroundCubeMaterial",uniforms:qr(Dn.backgroundCube.uniforms),vertexShader:Dn.backgroundCube.vertexShader,fragmentShader:Dn.backgroundCube.fragmentShader,side:Bt,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(b,E,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),Ui.copy(y.backgroundRotation),Ui.x*=-1,Ui.y*=-1,Ui.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(Ui.y*=-1,Ui.z*=-1),u.material.uniforms.envMap.value=S,u.material.uniforms.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Sv.makeRotationFromEuler(Ui)),u.material.toneMapped=st.getTransfer(S.colorSpace)!==lt,(f!==S||d!==S.version||p!==n.toneMapping)&&(u.material.needsUpdate=!0,f=S,d=S.version,p=n.toneMapping),u.layers.enableAll(),v.unshift(u,u.geometry,u.material,0,0,null)):S&&S.isTexture&&(l===void 0&&(l=new Wt(new Zs(2,2),new wi({name:"BackgroundMaterial",uniforms:qr(Dn.background.uniforms),vertexShader:Dn.background.vertexShader,fragmentShader:Dn.background.fragmentShader,side:Ei,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(l)),l.material.uniforms.t2D.value=S,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.toneMapped=st.getTransfer(S.colorSpace)!==lt,S.matrixAutoUpdate===!0&&S.updateMatrix(),l.material.uniforms.uvTransform.value.copy(S.matrix),(f!==S||d!==S.version||p!==n.toneMapping)&&(l.material.needsUpdate=!0,f=S,d=S.version,p=n.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function m(v,y){v.getRGB(Io,Ch(n)),i.buffers.color.setClear(Io.r,Io.g,Io.b,y,o)}return{getClearColor:function(){return a},setClearColor:function(v,y=1){a.set(v),c=y,m(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(v){c=v,m(a,c)},render:_,addToRenderList:h}}function Ev(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=d(null);let s=r,o=!1;function a(x,P,V,O,R){let I=!1;const N=f(O,V,P);s!==N&&(s=N,l(s.object)),I=p(x,O,V,R),I&&g(x,O,V,R),R!==null&&e.update(R,n.ELEMENT_ARRAY_BUFFER),(I||o)&&(o=!1,S(x,P,V,O),R!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(R).buffer))}function c(){return n.createVertexArray()}function l(x){return n.bindVertexArray(x)}function u(x){return n.deleteVertexArray(x)}function f(x,P,V){const O=V.wireframe===!0;let R=i[x.id];R===void 0&&(R={},i[x.id]=R);let I=R[P.id];I===void 0&&(I={},R[P.id]=I);let N=I[O];return N===void 0&&(N=d(c()),I[O]=N),N}function d(x){const P=[],V=[],O=[];for(let R=0;R<t;R++)P[R]=0,V[R]=0,O[R]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:V,attributeDivisors:O,object:x,attributes:{},index:null}}function p(x,P,V,O){const R=s.attributes,I=P.attributes;let N=0;const H=V.getAttributes();for(const F in H)if(H[F].location>=0){const ne=R[F];let U=I[F];if(U===void 0&&(F==="instanceMatrix"&&x.instanceMatrix&&(U=x.instanceMatrix),F==="instanceColor"&&x.instanceColor&&(U=x.instanceColor)),ne===void 0||ne.attribute!==U||U&&ne.data!==U.data)return!0;N++}return s.attributesNum!==N||s.index!==O}function g(x,P,V,O){const R={},I=P.attributes;let N=0;const H=V.getAttributes();for(const F in H)if(H[F].location>=0){let ne=I[F];ne===void 0&&(F==="instanceMatrix"&&x.instanceMatrix&&(ne=x.instanceMatrix),F==="instanceColor"&&x.instanceColor&&(ne=x.instanceColor));const U={};U.attribute=ne,ne&&ne.data&&(U.data=ne.data),R[F]=U,N++}s.attributes=R,s.attributesNum=N,s.index=O}function _(){const x=s.newAttributes;for(let P=0,V=x.length;P<V;P++)x[P]=0}function h(x){m(x,0)}function m(x,P){const V=s.newAttributes,O=s.enabledAttributes,R=s.attributeDivisors;V[x]=1,O[x]===0&&(n.enableVertexAttribArray(x),O[x]=1),R[x]!==P&&(n.vertexAttribDivisor(x,P),R[x]=P)}function v(){const x=s.newAttributes,P=s.enabledAttributes;for(let V=0,O=P.length;V<O;V++)P[V]!==x[V]&&(n.disableVertexAttribArray(V),P[V]=0)}function y(x,P,V,O,R,I,N){N===!0?n.vertexAttribIPointer(x,P,V,R,I):n.vertexAttribPointer(x,P,V,O,R,I)}function S(x,P,V,O){_();const R=O.attributes,I=V.getAttributes(),N=P.defaultAttributeValues;for(const H in I){const F=I[H];if(F.location>=0){let ee=R[H];if(ee===void 0&&(H==="instanceMatrix"&&x.instanceMatrix&&(ee=x.instanceMatrix),H==="instanceColor"&&x.instanceColor&&(ee=x.instanceColor)),ee!==void 0){const ne=ee.normalized,U=ee.itemSize,K=e.get(ee);if(K===void 0)continue;const se=K.buffer,X=K.type,j=K.bytesPerElement,he=X===n.INT||X===n.UNSIGNED_INT||ee.gpuType===Ql;if(ee.isInterleavedBufferAttribute){const fe=ee.data,Ce=fe.stride,Ne=ee.offset;if(fe.isInstancedInterleavedBuffer){for(let Se=0;Se<F.locationSize;Se++)m(F.location+Se,fe.meshPerAttribute);x.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=fe.meshPerAttribute*fe.count)}else for(let Se=0;Se<F.locationSize;Se++)h(F.location+Se);n.bindBuffer(n.ARRAY_BUFFER,se);for(let Se=0;Se<F.locationSize;Se++)y(F.location+Se,U/F.locationSize,X,ne,Ce*j,(Ne+U/F.locationSize*Se)*j,he)}else{if(ee.isInstancedBufferAttribute){for(let fe=0;fe<F.locationSize;fe++)m(F.location+fe,ee.meshPerAttribute);x.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let fe=0;fe<F.locationSize;fe++)h(F.location+fe);n.bindBuffer(n.ARRAY_BUFFER,se);for(let fe=0;fe<F.locationSize;fe++)y(F.location+fe,U/F.locationSize,X,ne,U*j,U/F.locationSize*fe*j,he)}}else if(N!==void 0){const ne=N[H];if(ne!==void 0)switch(ne.length){case 2:n.vertexAttrib2fv(F.location,ne);break;case 3:n.vertexAttrib3fv(F.location,ne);break;case 4:n.vertexAttrib4fv(F.location,ne);break;default:n.vertexAttrib1fv(F.location,ne)}}}}v()}function b(){C();for(const x in i){const P=i[x];for(const V in P){const O=P[V];for(const R in O)u(O[R].object),delete O[R];delete P[V]}delete i[x]}}function E(x){if(i[x.id]===void 0)return;const P=i[x.id];for(const V in P){const O=P[V];for(const R in O)u(O[R].object),delete O[R];delete P[V]}delete i[x.id]}function A(x){for(const P in i){const V=i[P];if(V[x.id]===void 0)continue;const O=V[x.id];for(const R in O)u(O[R].object),delete O[R];delete V[x.id]}}function C(){w(),o=!0,s!==r&&(s=r,l(s.object))}function w(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:C,resetDefaultState:w,dispose:b,releaseStatesOfGeometry:E,releaseStatesOfProgram:A,initAttributes:_,enableAttribute:h,disableUnusedAttributes:v}}function wv(n,e,t){let i;function r(l){i=l}function s(l,u){n.drawArrays(i,l,u),t.update(u,i,1)}function o(l,u,f){f!==0&&(n.drawArraysInstanced(i,l,u,f),t.update(u,i,f))}function a(l,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,u,0,f);let p=0;for(let g=0;g<f;g++)p+=u[g];t.update(p,i,1)}function c(l,u,f,d){if(f===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<l.length;g++)o(l[g],u[g],d[g]);else{p.multiDrawArraysInstancedWEBGL(i,l,0,u,0,d,0,f);let g=0;for(let _=0;_<f;_++)g+=u[_];for(let _=0;_<d.length;_++)t.update(g,i,d[_])}}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function bv(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const E=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(E){return!(E!==bn&&i.convert(E)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(E){const A=E===$s&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(E!==Jn&&i.convert(E)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&E!==$n&&!A)}function c(E){if(E==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const u=c(l);u!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);const f=t.logarithmicDepthBuffer===!0,d=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_TEXTURE_SIZE),_=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),h=n.getParameter(n.MAX_VERTEX_ATTRIBS),m=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),v=n.getParameter(n.MAX_VARYING_VECTORS),y=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),S=p>0,b=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:f,maxTextures:d,maxVertexTextures:p,maxTextureSize:g,maxCubemapSize:_,maxAttributes:h,maxVertexUniforms:m,maxVaryings:v,maxFragmentUniforms:y,vertexTextures:S,maxSamples:b}}function Tv(n){const e=this;let t=null,i=0,r=!1,s=!1;const o=new zi,a=new We,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,d){const p=f.length!==0||d||i!==0||r;return r=d,i=f.length,p},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,d){t=u(f,d,0)},this.setState=function(f,d,p){const g=f.clippingPlanes,_=f.clipIntersection,h=f.clipShadows,m=n.get(f);if(!r||g===null||g.length===0||s&&!h)s?u(null):l();else{const v=s?0:i,y=v*4;let S=m.clippingState||null;c.value=S,S=u(g,d,y,p);for(let b=0;b!==y;++b)S[b]=t[b];m.clippingState=S,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(f,d,p,g){const _=f!==null?f.length:0;let h=null;if(_!==0){if(h=c.value,g!==!0||h===null){const m=p+_*4,v=d.matrixWorldInverse;a.getNormalMatrix(v),(h===null||h.length<m)&&(h=new Float32Array(m));for(let y=0,S=p;y!==_;++y,S+=4)o.copy(f[y]).applyMatrix4(v,a),o.normal.toArray(h,S),h[S+3]=o.constant}c.value=h,c.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,h}}function Av(n){let e=new WeakMap;function t(o,a){return a===el?o.mapping=Gr:a===tl&&(o.mapping=Vr),o}function i(o){if(o&&o.isTexture){const a=o.mapping;if(a===el||a===tl)if(e.has(o)){const c=e.get(o).texture;return t(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new Og(c.height);return l.fromEquirectangularTexture(n,o),e.set(o,l),o.addEventListener("dispose",r),t(l.texture,o.mapping)}else return null}}return o}function r(o){const a=o.target;a.removeEventListener("dispose",r);const c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function s(){e=new WeakMap}return{get:i,dispose:s}}class Rv extends Ph{constructor(e=-1,t=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,o=i+e,a=r+t,c=r-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,o=s+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Ur=4,hd=[.125,.215,.35,.446,.526,.582],Wi=20,xc=new Rv,pd=new Ke;let Sc=null,Mc=0,Ec=0,wc=!1;const Hi=(1+Math.sqrt(5))/2,br=1/Hi,md=[new W(-Hi,br,0),new W(Hi,br,0),new W(-br,0,Hi),new W(br,0,Hi),new W(0,Hi,-br),new W(0,Hi,br),new W(-1,1,-1),new W(1,1,-1),new W(-1,1,1),new W(1,1,1)];class gd{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,r=100){Sc=this._renderer.getRenderTarget(),Mc=this._renderer.getActiveCubeFace(),Ec=this._renderer.getActiveMipmapLevel(),wc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,i,r,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=yd(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=vd(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Sc,Mc,Ec),this._renderer.xr.enabled=wc,e.scissorTest=!1,Do(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Gr||e.mapping===Vr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Sc=this._renderer.getRenderTarget(),Mc=this._renderer.getActiveCubeFace(),Ec=this._renderer.getActiveMipmapLevel(),wc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:wn,minFilter:wn,generateMipmaps:!1,type:$s,format:bn,colorSpace:Ti,depthBuffer:!1},r=_d(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=_d(e,t,i);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Cv(s)),this._blurMaterial=Pv(s,e,t)}return r}_compileMaterial(e){const t=new Wt(this._lodPlanes[0],e);this._renderer.compile(t,xc)}_sceneToCubeUV(e,t,i,r){const a=new sn(90,1,t,i),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,d=u.toneMapping;u.getClearColor(pd),u.toneMapping=yi,u.autoClear=!1;const p=new Ai({name:"PMREM.Background",side:Bt,depthWrite:!1,depthTest:!1}),g=new Wt(new sr,p);let _=!1;const h=e.background;h?h.isColor&&(p.color.copy(h),e.background=null,_=!0):(p.color.copy(pd),_=!0);for(let m=0;m<6;m++){const v=m%3;v===0?(a.up.set(0,c[m],0),a.lookAt(l[m],0,0)):v===1?(a.up.set(0,0,c[m]),a.lookAt(0,l[m],0)):(a.up.set(0,c[m],0),a.lookAt(0,0,l[m]));const y=this._cubeSize;Do(r,v*y,m>2?y:0,y,y),u.setRenderTarget(r),_&&u.render(g,a),u.render(e,a)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=f,e.background=h}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===Gr||e.mapping===Vr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=yd()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=vd());const s=r?this._cubemapMaterial:this._equirectMaterial,o=new Wt(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=e;const c=this._cubeSize;Do(t,0,0,3*c,2*c),i.setRenderTarget(t),i.render(o,xc)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodPlanes.length;for(let s=1;s<r;s++){const o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=md[(r-s-1)%md.length];this._blur(e,s-1,s,o,a)}t.autoClear=i}_blur(e,t,i,r,s){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,r,"latitudinal",s),this._halfBlur(o,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,f=new Wt(this._lodPlanes[r],l),d=l.uniforms,p=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*Wi-1),_=s/g,h=isFinite(s)?1+Math.floor(u*_):Wi;h>Wi&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${h} samples when the maximum is set to ${Wi}`);const m=[];let v=0;for(let A=0;A<Wi;++A){const C=A/_,w=Math.exp(-C*C/2);m.push(w),A===0?v+=w:A<h&&(v+=2*w)}for(let A=0;A<m.length;A++)m[A]=m[A]/v;d.envMap.value=e.texture,d.samples.value=h,d.weights.value=m,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:y}=this;d.dTheta.value=g,d.mipInt.value=y-i;const S=this._sizeLods[r],b=3*S*(r>y-Ur?r-y+Ur:0),E=4*(this._cubeSize-S);Do(t,b,E,3*S,2*S),c.setRenderTarget(t),c.render(f,xc)}}function Cv(n){const e=[],t=[],i=[];let r=n;const s=n-Ur+1+hd.length;for(let o=0;o<s;o++){const a=Math.pow(2,r);t.push(a);let c=1/a;o>n-Ur?c=hd[o-n+Ur-1]:o===0&&(c=0),i.push(c);const l=1/(a-2),u=-l,f=1+l,d=[u,u,f,u,f,f,u,u,f,f,u,f],p=6,g=6,_=3,h=2,m=1,v=new Float32Array(_*g*p),y=new Float32Array(h*g*p),S=new Float32Array(m*g*p);for(let E=0;E<p;E++){const A=E%3*2/3-1,C=E>2?0:-1,w=[A,C,0,A+2/3,C,0,A+2/3,C+1,0,A,C,0,A+2/3,C+1,0,A,C+1,0];v.set(w,_*g*E),y.set(d,h*g*E);const x=[E,E,E,E,E,E];S.set(x,m*g*E)}const b=new Xt;b.setAttribute("position",new bt(v,_)),b.setAttribute("uv",new bt(y,h)),b.setAttribute("faceIndex",new bt(S,m)),e.push(b),r>Ur&&r--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function _d(n,e,t){const i=new tr(n,e,t);return i.texture.mapping=ka,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Do(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function Pv(n,e,t){const i=new Float32Array(Wi),r=new W(0,1,0);return new wi({name:"SphericalGaussianBlur",defines:{n:Wi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:cu(),fragmentShader:`

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
		`,blending:vi,depthTest:!1,depthWrite:!1})}function vd(){return new wi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:cu(),fragmentShader:`

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
		`,blending:vi,depthTest:!1,depthWrite:!1})}function yd(){return new wi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:cu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:vi,depthTest:!1,depthWrite:!1})}function cu(){return`

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
	`}function Lv(n){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){const c=a.mapping,l=c===el||c===tl,u=c===Gr||c===Vr;if(l||u){let f=e.get(a);const d=f!==void 0?f.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return t===null&&(t=new gd(n)),f=l?t.fromEquirectangular(a,f):t.fromCubemap(a,f),f.texture.pmremVersion=a.pmremVersion,e.set(a,f),f.texture;if(f!==void 0)return f.texture;{const p=a.image;return l&&p&&p.height>0||u&&p&&r(p)?(t===null&&(t=new gd(n)),f=l?t.fromEquirectangular(a):t.fromCubemap(a),f.texture.pmremVersion=a.pmremVersion,e.set(a,f),a.addEventListener("dispose",s),f.texture):null}}}return a}function r(a){let c=0;const l=6;for(let u=0;u<l;u++)a[u]!==void 0&&c++;return c===l}function s(a){const c=a.target;c.removeEventListener("dispose",s);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function Iv(n){const e={};function t(i){if(e[i]!==void 0)return e[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&ou("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function Dv(n,e,t,i){const r={},s=new WeakMap;function o(f){const d=f.target;d.index!==null&&e.remove(d.index);for(const g in d.attributes)e.remove(d.attributes[g]);for(const g in d.morphAttributes){const _=d.morphAttributes[g];for(let h=0,m=_.length;h<m;h++)e.remove(_[h])}d.removeEventListener("dispose",o),delete r[d.id];const p=s.get(d);p&&(e.remove(p),s.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(f,d){return r[d.id]===!0||(d.addEventListener("dispose",o),r[d.id]=!0,t.memory.geometries++),d}function c(f){const d=f.attributes;for(const g in d)e.update(d[g],n.ARRAY_BUFFER);const p=f.morphAttributes;for(const g in p){const _=p[g];for(let h=0,m=_.length;h<m;h++)e.update(_[h],n.ARRAY_BUFFER)}}function l(f){const d=[],p=f.index,g=f.attributes.position;let _=0;if(p!==null){const v=p.array;_=p.version;for(let y=0,S=v.length;y<S;y+=3){const b=v[y+0],E=v[y+1],A=v[y+2];d.push(b,E,E,A,A,b)}}else if(g!==void 0){const v=g.array;_=g.version;for(let y=0,S=v.length/3-1;y<S;y+=3){const b=y+0,E=y+1,A=y+2;d.push(b,E,E,A,A,b)}}else return;const h=new(Mh(d)?Rh:Ah)(d,1);h.version=_;const m=s.get(f);m&&e.remove(m),s.set(f,h)}function u(f){const d=s.get(f);if(d){const p=f.index;p!==null&&d.version<p.version&&l(f)}else l(f);return s.get(f)}return{get:a,update:c,getWireframeAttribute:u}}function Uv(n,e,t){let i;function r(d){i=d}let s,o;function a(d){s=d.type,o=d.bytesPerElement}function c(d,p){n.drawElements(i,p,s,d*o),t.update(p,i,1)}function l(d,p,g){g!==0&&(n.drawElementsInstanced(i,p,s,d*o,g),t.update(p,i,g))}function u(d,p,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,s,d,0,g);let h=0;for(let m=0;m<g;m++)h+=p[m];t.update(h,i,1)}function f(d,p,g,_){if(g===0)return;const h=e.get("WEBGL_multi_draw");if(h===null)for(let m=0;m<d.length;m++)l(d[m]/o,p[m],_[m]);else{h.multiDrawElementsInstancedWEBGL(i,p,0,s,d,0,_,0,g);let m=0;for(let v=0;v<g;v++)m+=p[v];for(let v=0;v<_.length;v++)t.update(m,i,_[v])}}this.setMode=r,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u,this.renderMultiDrawInstances=f}function Nv(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(s/3);break;case n.LINES:t.lines+=a*(s/2);break;case n.LINE_STRIP:t.lines+=a*(s-1);break;case n.LINE_LOOP:t.lines+=a*s;break;case n.POINTS:t.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Fv(n,e,t){const i=new WeakMap,r=new wt;function s(o,a,c){const l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,f=u!==void 0?u.length:0;let d=i.get(a);if(d===void 0||d.count!==f){let w=function(){A.dispose(),i.delete(a),a.removeEventListener("dispose",w)};d!==void 0&&d.texture.dispose();const p=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,_=a.morphAttributes.color!==void 0,h=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],v=a.morphAttributes.color||[];let y=0;p===!0&&(y=1),g===!0&&(y=2),_===!0&&(y=3);let S=a.attributes.position.count*y,b=1;S>e.maxTextureSize&&(b=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);const E=new Float32Array(S*b*4*f),A=new wh(E,S,b,f);A.type=$n,A.needsUpdate=!0;const C=y*4;for(let x=0;x<f;x++){const P=h[x],V=m[x],O=v[x],R=S*b*4*x;for(let I=0;I<P.count;I++){const N=I*C;p===!0&&(r.fromBufferAttribute(P,I),E[R+N+0]=r.x,E[R+N+1]=r.y,E[R+N+2]=r.z,E[R+N+3]=0),g===!0&&(r.fromBufferAttribute(V,I),E[R+N+4]=r.x,E[R+N+5]=r.y,E[R+N+6]=r.z,E[R+N+7]=0),_===!0&&(r.fromBufferAttribute(O,I),E[R+N+8]=r.x,E[R+N+9]=r.y,E[R+N+10]=r.z,E[R+N+11]=O.itemSize===4?r.w:1)}}d={count:f,texture:A,size:new qe(S,b)},i.set(a,d),a.addEventListener("dispose",w)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let p=0;for(let _=0;_<l.length;_++)p+=l[_];const g=a.morphTargetsRelative?1:1-p;c.getUniforms().setValue(n,"morphTargetBaseInfluence",g),c.getUniforms().setValue(n,"morphTargetInfluences",l)}c.getUniforms().setValue(n,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:s}}function kv(n,e,t,i){let r=new WeakMap;function s(c){const l=i.render.frame,u=c.geometry,f=e.get(c,u);if(r.get(f)!==l&&(e.update(f),r.set(f,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),r.get(c)!==l&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),r.set(c,l))),c.isSkinnedMesh){const d=c.skeleton;r.get(d)!==l&&(d.update(),r.set(d,l))}return f}function o(){r=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:s,dispose:o}}class Uh extends zt{constructor(e,t,i,r,s,o,a,c,l,u=Fr){if(u!==Fr&&u!==Xr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&u===Fr&&(i=er),i===void 0&&u===Xr&&(i=Wr),super(null,r,s,o,a,c,u,i,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:Ct,this.minFilter=c!==void 0?c:Ct,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const Nh=new zt,xd=new Uh(1,1),Fh=new wh,kh=new Mg,Oh=new Lh,Sd=[],Md=[],Ed=new Float32Array(16),wd=new Float32Array(9),bd=new Float32Array(4);function es(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=Sd[r];if(s===void 0&&(s=new Float32Array(r),Sd[r]=s),e!==0){i.toArray(s,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(s,a)}return s}function St(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Mt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Ba(n,e){let t=Md[e];t===void 0&&(t=new Int32Array(e),Md[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Ov(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Bv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;n.uniform2fv(this.addr,e),Mt(t,e)}}function zv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(St(t,e))return;n.uniform3fv(this.addr,e),Mt(t,e)}}function Hv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;n.uniform4fv(this.addr,e),Mt(t,e)}}function Gv(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(St(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Mt(t,e)}else{if(St(t,i))return;bd.set(i),n.uniformMatrix2fv(this.addr,!1,bd),Mt(t,i)}}function Vv(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(St(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Mt(t,e)}else{if(St(t,i))return;wd.set(i),n.uniformMatrix3fv(this.addr,!1,wd),Mt(t,i)}}function Wv(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(St(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Mt(t,e)}else{if(St(t,i))return;Ed.set(i),n.uniformMatrix4fv(this.addr,!1,Ed),Mt(t,i)}}function Xv(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function qv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;n.uniform2iv(this.addr,e),Mt(t,e)}}function $v(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;n.uniform3iv(this.addr,e),Mt(t,e)}}function Yv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;n.uniform4iv(this.addr,e),Mt(t,e)}}function Kv(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function jv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;n.uniform2uiv(this.addr,e),Mt(t,e)}}function Zv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;n.uniform3uiv(this.addr,e),Mt(t,e)}}function Jv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;n.uniform4uiv(this.addr,e),Mt(t,e)}}function Qv(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(xd.compareFunction=Sh,s=xd):s=Nh,t.setTexture2D(e||s,r)}function ey(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||kh,r)}function ty(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||Oh,r)}function ny(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||Fh,r)}function iy(n){switch(n){case 5126:return Ov;case 35664:return Bv;case 35665:return zv;case 35666:return Hv;case 35674:return Gv;case 35675:return Vv;case 35676:return Wv;case 5124:case 35670:return Xv;case 35667:case 35671:return qv;case 35668:case 35672:return $v;case 35669:case 35673:return Yv;case 5125:return Kv;case 36294:return jv;case 36295:return Zv;case 36296:return Jv;case 35678:case 36198:case 36298:case 36306:case 35682:return Qv;case 35679:case 36299:case 36307:return ey;case 35680:case 36300:case 36308:case 36293:return ty;case 36289:case 36303:case 36311:case 36292:return ny}}function ry(n,e){n.uniform1fv(this.addr,e)}function sy(n,e){const t=es(e,this.size,2);n.uniform2fv(this.addr,t)}function oy(n,e){const t=es(e,this.size,3);n.uniform3fv(this.addr,t)}function ay(n,e){const t=es(e,this.size,4);n.uniform4fv(this.addr,t)}function cy(n,e){const t=es(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function ly(n,e){const t=es(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function uy(n,e){const t=es(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function dy(n,e){n.uniform1iv(this.addr,e)}function fy(n,e){n.uniform2iv(this.addr,e)}function hy(n,e){n.uniform3iv(this.addr,e)}function py(n,e){n.uniform4iv(this.addr,e)}function my(n,e){n.uniform1uiv(this.addr,e)}function gy(n,e){n.uniform2uiv(this.addr,e)}function _y(n,e){n.uniform3uiv(this.addr,e)}function vy(n,e){n.uniform4uiv(this.addr,e)}function yy(n,e,t){const i=this.cache,r=e.length,s=Ba(t,r);St(i,s)||(n.uniform1iv(this.addr,s),Mt(i,s));for(let o=0;o!==r;++o)t.setTexture2D(e[o]||Nh,s[o])}function xy(n,e,t){const i=this.cache,r=e.length,s=Ba(t,r);St(i,s)||(n.uniform1iv(this.addr,s),Mt(i,s));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||kh,s[o])}function Sy(n,e,t){const i=this.cache,r=e.length,s=Ba(t,r);St(i,s)||(n.uniform1iv(this.addr,s),Mt(i,s));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||Oh,s[o])}function My(n,e,t){const i=this.cache,r=e.length,s=Ba(t,r);St(i,s)||(n.uniform1iv(this.addr,s),Mt(i,s));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||Fh,s[o])}function Ey(n){switch(n){case 5126:return ry;case 35664:return sy;case 35665:return oy;case 35666:return ay;case 35674:return cy;case 35675:return ly;case 35676:return uy;case 5124:case 35670:return dy;case 35667:case 35671:return fy;case 35668:case 35672:return hy;case 35669:case 35673:return py;case 5125:return my;case 36294:return gy;case 36295:return _y;case 36296:return vy;case 35678:case 36198:case 36298:case 36306:case 35682:return yy;case 35679:case 36299:case 36307:return xy;case 35680:case 36300:case 36308:case 36293:return Sy;case 36289:case 36303:case 36311:case 36292:return My}}class wy{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=iy(t.type)}}class by{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Ey(t.type)}}class Ty{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const a=r[s];a.setValue(e,t[a.id],i)}}}const bc=/(\w+)(\])?(\[|\.)?/g;function Td(n,e){n.seq.push(e),n.map[e.id]=e}function Ay(n,e,t){const i=n.name,r=i.length;for(bc.lastIndex=0;;){const s=bc.exec(i),o=bc.lastIndex;let a=s[1];const c=s[2]==="]",l=s[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===r){Td(t,l===void 0?new wy(a,n,e):new by(a,n,e));break}else{let f=t.map[a];f===void 0&&(f=new Ty(a),Td(t,f)),t=f}}}class oa{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const s=e.getActiveUniform(t,r),o=e.getUniformLocation(t,s.name);Ay(s,o,this)}}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,o=t.length;s!==o;++s){const a=t[s],c=i[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const o=e[r];o.id in t&&i.push(o)}return i}}function Ad(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const Ry=37297;let Cy=0;function Py(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=r;o<s;o++){const a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}function Ly(n){const e=st.getPrimaries(st.workingColorSpace),t=st.getPrimaries(n);let i;switch(e===t?i="":e===_a&&t===ga?i="LinearDisplayP3ToLinearSRGB":e===ga&&t===_a&&(i="LinearSRGBToLinearDisplayP3"),n){case Ti:case Oa:return[i,"LinearTransferOETF"];case In:case su:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function Rd(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),r=n.getShaderInfoLog(e).trim();if(i&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const o=parseInt(s[1]);return t.toUpperCase()+`

`+r+`

`+Py(n.getShaderSource(e),o)}else return r}function Iy(n,e){const t=Ly(e);return`vec4 ${n}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function Dy(n,e){let t;switch(e){case Km:t="Linear";break;case jm:t="Reinhard";break;case Zm:t="OptimizedCineon";break;case Jm:t="ACESFilmic";break;case eg:t="AgX";break;case tg:t="Neutral";break;case Qm:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Uy(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ys).join(`
`)}function Ny(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Fy(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),o=s.name;let a=1;s.type===n.FLOAT_MAT2&&(a=2),s.type===n.FLOAT_MAT3&&(a=3),s.type===n.FLOAT_MAT4&&(a=4),t[o]={type:s.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function ys(n){return n!==""}function Cd(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Pd(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const ky=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ll(n){return n.replace(ky,By)}const Oy=new Map;function By(n,e){let t=Ve[e];if(t===void 0){const i=Oy.get(e);if(i!==void 0)t=Ve[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Ll(t)}const zy=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ld(n){return n.replace(zy,Hy)}function Hy(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Id(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Gy(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===ch?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Sm?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Wn&&(e="SHADOWMAP_TYPE_VSM"),e}function Vy(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Gr:case Vr:e="ENVMAP_TYPE_CUBE";break;case ka:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Wy(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Vr:e="ENVMAP_MODE_REFRACTION";break}return e}function Xy(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case lh:e="ENVMAP_BLENDING_MULTIPLY";break;case $m:e="ENVMAP_BLENDING_MIX";break;case Ym:e="ENVMAP_BLENDING_ADD";break}return e}function qy(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function $y(n,e,t,i){const r=n.getContext(),s=t.defines;let o=t.vertexShader,a=t.fragmentShader;const c=Gy(t),l=Vy(t),u=Wy(t),f=Xy(t),d=qy(t),p=Uy(t),g=Ny(s),_=r.createProgram();let h,m,v=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ys).join(`
`),h.length>0&&(h+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ys).join(`
`),m.length>0&&(m+=`
`)):(h=[Id(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ys).join(`
`),m=[Id(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+f:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==yi?"#define TONE_MAPPING":"",t.toneMapping!==yi?Ve.tonemapping_pars_fragment:"",t.toneMapping!==yi?Dy("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ve.colorspace_pars_fragment,Iy("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ys).join(`
`)),o=Ll(o),o=Cd(o,t),o=Pd(o,t),a=Ll(a),a=Cd(a,t),a=Pd(a,t),o=Ld(o),a=Ld(a),t.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,h=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+h,m=["#define varying in",t.glslVersion===$u?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===$u?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const y=v+h+o,S=v+m+a,b=Ad(r,r.VERTEX_SHADER,y),E=Ad(r,r.FRAGMENT_SHADER,S);r.attachShader(_,b),r.attachShader(_,E),t.index0AttributeName!==void 0?r.bindAttribLocation(_,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(_,0,"position"),r.linkProgram(_);function A(P){if(n.debug.checkShaderErrors){const V=r.getProgramInfoLog(_).trim(),O=r.getShaderInfoLog(b).trim(),R=r.getShaderInfoLog(E).trim();let I=!0,N=!0;if(r.getProgramParameter(_,r.LINK_STATUS)===!1)if(I=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,_,b,E);else{const H=Rd(r,b,"vertex"),F=Rd(r,E,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(_,r.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+V+`
`+H+`
`+F)}else V!==""?console.warn("THREE.WebGLProgram: Program Info Log:",V):(O===""||R==="")&&(N=!1);N&&(P.diagnostics={runnable:I,programLog:V,vertexShader:{log:O,prefix:h},fragmentShader:{log:R,prefix:m}})}r.deleteShader(b),r.deleteShader(E),C=new oa(r,_),w=Fy(r,_)}let C;this.getUniforms=function(){return C===void 0&&A(this),C};let w;this.getAttributes=function(){return w===void 0&&A(this),w};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=r.getProgramParameter(_,Ry)),x},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Cy++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=b,this.fragmentShader=E,this}let Yy=0;class Ky{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new jy(e),t.set(e,i)),i}}class jy{constructor(e){this.id=Yy++,this.code=e,this.usedTimes=0}}function Zy(n,e,t,i,r,s,o){const a=new bh,c=new Ky,l=new Set,u=[],f=r.logarithmicDepthBuffer,d=r.vertexTextures;let p=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(w){return l.add(w),w===0?"uv":`uv${w}`}function h(w,x,P,V,O){const R=V.fog,I=O.geometry,N=w.isMeshStandardMaterial?V.environment:null,H=(w.isMeshStandardMaterial?t:e).get(w.envMap||N),F=H&&H.mapping===ka?H.image.height:null,ee=g[w.type];w.precision!==null&&(p=r.getMaxPrecision(w.precision),p!==w.precision&&console.warn("THREE.WebGLProgram.getParameters:",w.precision,"not supported, using",p,"instead."));const ne=I.morphAttributes.position||I.morphAttributes.normal||I.morphAttributes.color,U=ne!==void 0?ne.length:0;let K=0;I.morphAttributes.position!==void 0&&(K=1),I.morphAttributes.normal!==void 0&&(K=2),I.morphAttributes.color!==void 0&&(K=3);let se,X,j,he;if(ee){const Qe=Dn[ee];se=Qe.vertexShader,X=Qe.fragmentShader}else se=w.vertexShader,X=w.fragmentShader,c.update(w),j=c.getVertexShaderID(w),he=c.getFragmentShaderID(w);const fe=n.getRenderTarget(),Ce=O.isInstancedMesh===!0,Ne=O.isBatchedMesh===!0,Se=!!w.map,$e=!!w.matcap,D=!!H,ct=!!w.aoMap,Ye=!!w.lightMap,Ie=!!w.bumpMap,Re=!!w.normalMap,dt=!!w.displacementMap,Fe=!!w.emissiveMap,Be=!!w.metalnessMap,L=!!w.roughnessMap,M=w.anisotropy>0,Y=w.clearcoat>0,re=w.dispersion>0,oe=w.iridescence>0,ie=w.sheen>0,Le=w.transmission>0,ye=M&&!!w.anisotropyMap,Ee=Y&&!!w.clearcoatMap,He=Y&&!!w.clearcoatNormalMap,ue=Y&&!!w.clearcoatRoughnessMap,J=oe&&!!w.iridescenceMap,ge=oe&&!!w.iridescenceThicknessMap,_e=ie&&!!w.sheenColorMap,ce=ie&&!!w.sheenRoughnessMap,ae=!!w.specularMap,Te=!!w.specularColorMap,Xe=!!w.specularIntensityMap,k=Le&&!!w.transmissionMap,de=Le&&!!w.thicknessMap,Q=!!w.gradientMap,te=!!w.alphaMap,me=w.alphaTest>0,De=!!w.alphaHash,Ze=!!w.extensions;let _t=yi;w.toneMapped&&(fe===null||fe.isXRRenderTarget===!0)&&(_t=n.toneMapping);const Tt={shaderID:ee,shaderType:w.type,shaderName:w.name,vertexShader:se,fragmentShader:X,defines:w.defines,customVertexShaderID:j,customFragmentShaderID:he,isRawShaderMaterial:w.isRawShaderMaterial===!0,glslVersion:w.glslVersion,precision:p,batching:Ne,batchingColor:Ne&&O._colorsTexture!==null,instancing:Ce,instancingColor:Ce&&O.instanceColor!==null,instancingMorph:Ce&&O.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:fe===null?n.outputColorSpace:fe.isXRRenderTarget===!0?fe.texture.colorSpace:Ti,alphaToCoverage:!!w.alphaToCoverage,map:Se,matcap:$e,envMap:D,envMapMode:D&&H.mapping,envMapCubeUVHeight:F,aoMap:ct,lightMap:Ye,bumpMap:Ie,normalMap:Re,displacementMap:d&&dt,emissiveMap:Fe,normalMapObjectSpace:Re&&w.normalMapType===og,normalMapTangentSpace:Re&&w.normalMapType===sg,metalnessMap:Be,roughnessMap:L,anisotropy:M,anisotropyMap:ye,clearcoat:Y,clearcoatMap:Ee,clearcoatNormalMap:He,clearcoatRoughnessMap:ue,dispersion:re,iridescence:oe,iridescenceMap:J,iridescenceThicknessMap:ge,sheen:ie,sheenColorMap:_e,sheenRoughnessMap:ce,specularMap:ae,specularColorMap:Te,specularIntensityMap:Xe,transmission:Le,transmissionMap:k,thicknessMap:de,gradientMap:Q,opaque:w.transparent===!1&&w.blending===Nr&&w.alphaToCoverage===!1,alphaMap:te,alphaTest:me,alphaHash:De,combine:w.combine,mapUv:Se&&_(w.map.channel),aoMapUv:ct&&_(w.aoMap.channel),lightMapUv:Ye&&_(w.lightMap.channel),bumpMapUv:Ie&&_(w.bumpMap.channel),normalMapUv:Re&&_(w.normalMap.channel),displacementMapUv:dt&&_(w.displacementMap.channel),emissiveMapUv:Fe&&_(w.emissiveMap.channel),metalnessMapUv:Be&&_(w.metalnessMap.channel),roughnessMapUv:L&&_(w.roughnessMap.channel),anisotropyMapUv:ye&&_(w.anisotropyMap.channel),clearcoatMapUv:Ee&&_(w.clearcoatMap.channel),clearcoatNormalMapUv:He&&_(w.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ue&&_(w.clearcoatRoughnessMap.channel),iridescenceMapUv:J&&_(w.iridescenceMap.channel),iridescenceThicknessMapUv:ge&&_(w.iridescenceThicknessMap.channel),sheenColorMapUv:_e&&_(w.sheenColorMap.channel),sheenRoughnessMapUv:ce&&_(w.sheenRoughnessMap.channel),specularMapUv:ae&&_(w.specularMap.channel),specularColorMapUv:Te&&_(w.specularColorMap.channel),specularIntensityMapUv:Xe&&_(w.specularIntensityMap.channel),transmissionMapUv:k&&_(w.transmissionMap.channel),thicknessMapUv:de&&_(w.thicknessMap.channel),alphaMapUv:te&&_(w.alphaMap.channel),vertexTangents:!!I.attributes.tangent&&(Re||M),vertexColors:w.vertexColors,vertexAlphas:w.vertexColors===!0&&!!I.attributes.color&&I.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!I.attributes.uv&&(Se||te),fog:!!R,useFog:w.fog===!0,fogExp2:!!R&&R.isFogExp2,flatShading:w.flatShading===!0,sizeAttenuation:w.sizeAttenuation===!0,logarithmicDepthBuffer:f,skinning:O.isSkinnedMesh===!0,morphTargets:I.morphAttributes.position!==void 0,morphNormals:I.morphAttributes.normal!==void 0,morphColors:I.morphAttributes.color!==void 0,morphTargetsCount:U,morphTextureStride:K,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:w.dithering,shadowMapEnabled:n.shadowMap.enabled&&P.length>0,shadowMapType:n.shadowMap.type,toneMapping:_t,decodeVideoTexture:Se&&w.map.isVideoTexture===!0&&st.getTransfer(w.map.colorSpace)===lt,premultipliedAlpha:w.premultipliedAlpha,doubleSided:w.side===En,flipSided:w.side===Bt,useDepthPacking:w.depthPacking>=0,depthPacking:w.depthPacking||0,index0AttributeName:w.index0AttributeName,extensionClipCullDistance:Ze&&w.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ze&&w.extensions.multiDraw===!0||Ne)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:w.customProgramCacheKey()};return Tt.vertexUv1s=l.has(1),Tt.vertexUv2s=l.has(2),Tt.vertexUv3s=l.has(3),l.clear(),Tt}function m(w){const x=[];if(w.shaderID?x.push(w.shaderID):(x.push(w.customVertexShaderID),x.push(w.customFragmentShaderID)),w.defines!==void 0)for(const P in w.defines)x.push(P),x.push(w.defines[P]);return w.isRawShaderMaterial===!1&&(v(x,w),y(x,w),x.push(n.outputColorSpace)),x.push(w.customProgramCacheKey),x.join()}function v(w,x){w.push(x.precision),w.push(x.outputColorSpace),w.push(x.envMapMode),w.push(x.envMapCubeUVHeight),w.push(x.mapUv),w.push(x.alphaMapUv),w.push(x.lightMapUv),w.push(x.aoMapUv),w.push(x.bumpMapUv),w.push(x.normalMapUv),w.push(x.displacementMapUv),w.push(x.emissiveMapUv),w.push(x.metalnessMapUv),w.push(x.roughnessMapUv),w.push(x.anisotropyMapUv),w.push(x.clearcoatMapUv),w.push(x.clearcoatNormalMapUv),w.push(x.clearcoatRoughnessMapUv),w.push(x.iridescenceMapUv),w.push(x.iridescenceThicknessMapUv),w.push(x.sheenColorMapUv),w.push(x.sheenRoughnessMapUv),w.push(x.specularMapUv),w.push(x.specularColorMapUv),w.push(x.specularIntensityMapUv),w.push(x.transmissionMapUv),w.push(x.thicknessMapUv),w.push(x.combine),w.push(x.fogExp2),w.push(x.sizeAttenuation),w.push(x.morphTargetsCount),w.push(x.morphAttributeCount),w.push(x.numDirLights),w.push(x.numPointLights),w.push(x.numSpotLights),w.push(x.numSpotLightMaps),w.push(x.numHemiLights),w.push(x.numRectAreaLights),w.push(x.numDirLightShadows),w.push(x.numPointLightShadows),w.push(x.numSpotLightShadows),w.push(x.numSpotLightShadowsWithMaps),w.push(x.numLightProbes),w.push(x.shadowMapType),w.push(x.toneMapping),w.push(x.numClippingPlanes),w.push(x.numClipIntersection),w.push(x.depthPacking)}function y(w,x){a.disableAll(),x.supportsVertexTextures&&a.enable(0),x.instancing&&a.enable(1),x.instancingColor&&a.enable(2),x.instancingMorph&&a.enable(3),x.matcap&&a.enable(4),x.envMap&&a.enable(5),x.normalMapObjectSpace&&a.enable(6),x.normalMapTangentSpace&&a.enable(7),x.clearcoat&&a.enable(8),x.iridescence&&a.enable(9),x.alphaTest&&a.enable(10),x.vertexColors&&a.enable(11),x.vertexAlphas&&a.enable(12),x.vertexUv1s&&a.enable(13),x.vertexUv2s&&a.enable(14),x.vertexUv3s&&a.enable(15),x.vertexTangents&&a.enable(16),x.anisotropy&&a.enable(17),x.alphaHash&&a.enable(18),x.batching&&a.enable(19),x.dispersion&&a.enable(20),x.batchingColor&&a.enable(21),w.push(a.mask),a.disableAll(),x.fog&&a.enable(0),x.useFog&&a.enable(1),x.flatShading&&a.enable(2),x.logarithmicDepthBuffer&&a.enable(3),x.skinning&&a.enable(4),x.morphTargets&&a.enable(5),x.morphNormals&&a.enable(6),x.morphColors&&a.enable(7),x.premultipliedAlpha&&a.enable(8),x.shadowMapEnabled&&a.enable(9),x.doubleSided&&a.enable(10),x.flipSided&&a.enable(11),x.useDepthPacking&&a.enable(12),x.dithering&&a.enable(13),x.transmission&&a.enable(14),x.sheen&&a.enable(15),x.opaque&&a.enable(16),x.pointsUvs&&a.enable(17),x.decodeVideoTexture&&a.enable(18),x.alphaToCoverage&&a.enable(19),w.push(a.mask)}function S(w){const x=g[w.type];let P;if(x){const V=Dn[x];P=Ug.clone(V.uniforms)}else P=w.uniforms;return P}function b(w,x){let P;for(let V=0,O=u.length;V<O;V++){const R=u[V];if(R.cacheKey===x){P=R,++P.usedTimes;break}}return P===void 0&&(P=new $y(n,x,w,s),u.push(P)),P}function E(w){if(--w.usedTimes===0){const x=u.indexOf(w);u[x]=u[u.length-1],u.pop(),w.destroy()}}function A(w){c.remove(w)}function C(){c.dispose()}return{getParameters:h,getProgramCacheKey:m,getUniforms:S,acquireProgram:b,releaseProgram:E,releaseShaderCache:A,programs:u,dispose:C}}function Jy(){let n=new WeakMap;function e(s){let o=n.get(s);return o===void 0&&(o={},n.set(s,o)),o}function t(s){n.delete(s)}function i(s,o,a){n.get(s)[o]=a}function r(){n=new WeakMap}return{get:e,remove:t,update:i,dispose:r}}function Qy(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Dd(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Ud(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function o(f,d,p,g,_,h){let m=n[e];return m===void 0?(m={id:f.id,object:f,geometry:d,material:p,groupOrder:g,renderOrder:f.renderOrder,z:_,group:h},n[e]=m):(m.id=f.id,m.object=f,m.geometry=d,m.material=p,m.groupOrder=g,m.renderOrder=f.renderOrder,m.z=_,m.group=h),e++,m}function a(f,d,p,g,_,h){const m=o(f,d,p,g,_,h);p.transmission>0?i.push(m):p.transparent===!0?r.push(m):t.push(m)}function c(f,d,p,g,_,h){const m=o(f,d,p,g,_,h);p.transmission>0?i.unshift(m):p.transparent===!0?r.unshift(m):t.unshift(m)}function l(f,d){t.length>1&&t.sort(f||Qy),i.length>1&&i.sort(d||Dd),r.length>1&&r.sort(d||Dd)}function u(){for(let f=e,d=n.length;f<d;f++){const p=n[f];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:a,unshift:c,finish:u,sort:l}}function ex(){let n=new WeakMap;function e(i,r){const s=n.get(i);let o;return s===void 0?(o=new Ud,n.set(i,[o])):r>=s.length?(o=new Ud,s.push(o)):o=s[r],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function tx(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new W,color:new Ke};break;case"SpotLight":t={position:new W,direction:new W,color:new Ke,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new W,color:new Ke,distance:0,decay:0};break;case"HemisphereLight":t={direction:new W,skyColor:new Ke,groundColor:new Ke};break;case"RectAreaLight":t={color:new Ke,position:new W,halfWidth:new W,halfHeight:new W};break}return n[e.id]=t,t}}}function nx(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let ix=0;function rx(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function sx(n){const e=new tx,t=nx(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new W);const r=new W,s=new mt,o=new mt;function a(l){let u=0,f=0,d=0;for(let w=0;w<9;w++)i.probe[w].set(0,0,0);let p=0,g=0,_=0,h=0,m=0,v=0,y=0,S=0,b=0,E=0,A=0;l.sort(rx);for(let w=0,x=l.length;w<x;w++){const P=l[w],V=P.color,O=P.intensity,R=P.distance,I=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)u+=V.r*O,f+=V.g*O,d+=V.b*O;else if(P.isLightProbe){for(let N=0;N<9;N++)i.probe[N].addScaledVector(P.sh.coefficients[N],O);A++}else if(P.isDirectionalLight){const N=e.get(P);if(N.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const H=P.shadow,F=t.get(P);F.shadowIntensity=H.intensity,F.shadowBias=H.bias,F.shadowNormalBias=H.normalBias,F.shadowRadius=H.radius,F.shadowMapSize=H.mapSize,i.directionalShadow[p]=F,i.directionalShadowMap[p]=I,i.directionalShadowMatrix[p]=P.shadow.matrix,v++}i.directional[p]=N,p++}else if(P.isSpotLight){const N=e.get(P);N.position.setFromMatrixPosition(P.matrixWorld),N.color.copy(V).multiplyScalar(O),N.distance=R,N.coneCos=Math.cos(P.angle),N.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),N.decay=P.decay,i.spot[_]=N;const H=P.shadow;if(P.map&&(i.spotLightMap[b]=P.map,b++,H.updateMatrices(P),P.castShadow&&E++),i.spotLightMatrix[_]=H.matrix,P.castShadow){const F=t.get(P);F.shadowIntensity=H.intensity,F.shadowBias=H.bias,F.shadowNormalBias=H.normalBias,F.shadowRadius=H.radius,F.shadowMapSize=H.mapSize,i.spotShadow[_]=F,i.spotShadowMap[_]=I,S++}_++}else if(P.isRectAreaLight){const N=e.get(P);N.color.copy(V).multiplyScalar(O),N.halfWidth.set(P.width*.5,0,0),N.halfHeight.set(0,P.height*.5,0),i.rectArea[h]=N,h++}else if(P.isPointLight){const N=e.get(P);if(N.color.copy(P.color).multiplyScalar(P.intensity),N.distance=P.distance,N.decay=P.decay,P.castShadow){const H=P.shadow,F=t.get(P);F.shadowIntensity=H.intensity,F.shadowBias=H.bias,F.shadowNormalBias=H.normalBias,F.shadowRadius=H.radius,F.shadowMapSize=H.mapSize,F.shadowCameraNear=H.camera.near,F.shadowCameraFar=H.camera.far,i.pointShadow[g]=F,i.pointShadowMap[g]=I,i.pointShadowMatrix[g]=P.shadow.matrix,y++}i.point[g]=N,g++}else if(P.isHemisphereLight){const N=e.get(P);N.skyColor.copy(P.color).multiplyScalar(O),N.groundColor.copy(P.groundColor).multiplyScalar(O),i.hemi[m]=N,m++}}h>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ve.LTC_FLOAT_1,i.rectAreaLTC2=ve.LTC_FLOAT_2):(i.rectAreaLTC1=ve.LTC_HALF_1,i.rectAreaLTC2=ve.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=f,i.ambient[2]=d;const C=i.hash;(C.directionalLength!==p||C.pointLength!==g||C.spotLength!==_||C.rectAreaLength!==h||C.hemiLength!==m||C.numDirectionalShadows!==v||C.numPointShadows!==y||C.numSpotShadows!==S||C.numSpotMaps!==b||C.numLightProbes!==A)&&(i.directional.length=p,i.spot.length=_,i.rectArea.length=h,i.point.length=g,i.hemi.length=m,i.directionalShadow.length=v,i.directionalShadowMap.length=v,i.pointShadow.length=y,i.pointShadowMap.length=y,i.spotShadow.length=S,i.spotShadowMap.length=S,i.directionalShadowMatrix.length=v,i.pointShadowMatrix.length=y,i.spotLightMatrix.length=S+b-E,i.spotLightMap.length=b,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=A,C.directionalLength=p,C.pointLength=g,C.spotLength=_,C.rectAreaLength=h,C.hemiLength=m,C.numDirectionalShadows=v,C.numPointShadows=y,C.numSpotShadows=S,C.numSpotMaps=b,C.numLightProbes=A,i.version=ix++)}function c(l,u){let f=0,d=0,p=0,g=0,_=0;const h=u.matrixWorldInverse;for(let m=0,v=l.length;m<v;m++){const y=l[m];if(y.isDirectionalLight){const S=i.directional[f];S.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(h),f++}else if(y.isSpotLight){const S=i.spot[p];S.position.setFromMatrixPosition(y.matrixWorld),S.position.applyMatrix4(h),S.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(h),p++}else if(y.isRectAreaLight){const S=i.rectArea[g];S.position.setFromMatrixPosition(y.matrixWorld),S.position.applyMatrix4(h),o.identity(),s.copy(y.matrixWorld),s.premultiply(h),o.extractRotation(s),S.halfWidth.set(y.width*.5,0,0),S.halfHeight.set(0,y.height*.5,0),S.halfWidth.applyMatrix4(o),S.halfHeight.applyMatrix4(o),g++}else if(y.isPointLight){const S=i.point[d];S.position.setFromMatrixPosition(y.matrixWorld),S.position.applyMatrix4(h),d++}else if(y.isHemisphereLight){const S=i.hemi[_];S.direction.setFromMatrixPosition(y.matrixWorld),S.direction.transformDirection(h),_++}}}return{setup:a,setupView:c,state:i}}function Nd(n){const e=new sx(n),t=[],i=[];function r(u){l.camera=u,t.length=0,i.length=0}function s(u){t.push(u)}function o(u){i.push(u)}function a(){e.setup(t)}function c(u){e.setupView(t,u)}const l={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:l,setupLights:a,setupLightsView:c,pushLight:s,pushShadow:o}}function ox(n){let e=new WeakMap;function t(r,s=0){const o=e.get(r);let a;return o===void 0?(a=new Nd(n),e.set(r,[a])):s>=o.length?(a=new Nd(n),o.push(a)):a=o[s],a}function i(){e=new WeakMap}return{get:t,dispose:i}}class ax extends rr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=ig,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class cx extends rr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const lx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,ux=`uniform sampler2D shadow_pass;
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
}`;function dx(n,e,t){let i=new Ih;const r=new qe,s=new qe,o=new wt,a=new ax({depthPacking:rg}),c=new cx,l={},u=t.maxTextureSize,f={[Ei]:Bt,[Bt]:Ei,[En]:En},d=new wi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new qe},radius:{value:4}},vertexShader:lx,fragmentShader:ux}),p=d.clone();p.defines.HORIZONTAL_PASS=1;const g=new Xt;g.setAttribute("position",new bt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Wt(g,d),h=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ch;let m=this.type;this.render=function(E,A,C){if(h.enabled===!1||h.autoUpdate===!1&&h.needsUpdate===!1||E.length===0)return;const w=n.getRenderTarget(),x=n.getActiveCubeFace(),P=n.getActiveMipmapLevel(),V=n.state;V.setBlending(vi),V.buffers.color.setClear(1,1,1,1),V.buffers.depth.setTest(!0),V.setScissorTest(!1);const O=m!==Wn&&this.type===Wn,R=m===Wn&&this.type!==Wn;for(let I=0,N=E.length;I<N;I++){const H=E[I],F=H.shadow;if(F===void 0){console.warn("THREE.WebGLShadowMap:",H,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;r.copy(F.mapSize);const ee=F.getFrameExtents();if(r.multiply(ee),s.copy(F.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/ee.x),r.x=s.x*ee.x,F.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/ee.y),r.y=s.y*ee.y,F.mapSize.y=s.y)),F.map===null||O===!0||R===!0){const U=this.type!==Wn?{minFilter:Ct,magFilter:Ct}:{};F.map!==null&&F.map.dispose(),F.map=new tr(r.x,r.y,U),F.map.texture.name=H.name+".shadowMap",F.camera.updateProjectionMatrix()}n.setRenderTarget(F.map),n.clear();const ne=F.getViewportCount();for(let U=0;U<ne;U++){const K=F.getViewport(U);o.set(s.x*K.x,s.y*K.y,s.x*K.z,s.y*K.w),V.viewport(o),F.updateMatrices(H,U),i=F.getFrustum(),S(A,C,F.camera,H,this.type)}F.isPointLightShadow!==!0&&this.type===Wn&&v(F,C),F.needsUpdate=!1}m=this.type,h.needsUpdate=!1,n.setRenderTarget(w,x,P)};function v(E,A){const C=e.update(_);d.defines.VSM_SAMPLES!==E.blurSamples&&(d.defines.VSM_SAMPLES=E.blurSamples,p.defines.VSM_SAMPLES=E.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new tr(r.x,r.y)),d.uniforms.shadow_pass.value=E.map.texture,d.uniforms.resolution.value=E.mapSize,d.uniforms.radius.value=E.radius,n.setRenderTarget(E.mapPass),n.clear(),n.renderBufferDirect(A,null,C,d,_,null),p.uniforms.shadow_pass.value=E.mapPass.texture,p.uniforms.resolution.value=E.mapSize,p.uniforms.radius.value=E.radius,n.setRenderTarget(E.map),n.clear(),n.renderBufferDirect(A,null,C,p,_,null)}function y(E,A,C,w){let x=null;const P=C.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(P!==void 0)x=P;else if(x=C.isPointLight===!0?c:a,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const V=x.uuid,O=A.uuid;let R=l[V];R===void 0&&(R={},l[V]=R);let I=R[O];I===void 0&&(I=x.clone(),R[O]=I,A.addEventListener("dispose",b)),x=I}if(x.visible=A.visible,x.wireframe=A.wireframe,w===Wn?x.side=A.shadowSide!==null?A.shadowSide:A.side:x.side=A.shadowSide!==null?A.shadowSide:f[A.side],x.alphaMap=A.alphaMap,x.alphaTest=A.alphaTest,x.map=A.map,x.clipShadows=A.clipShadows,x.clippingPlanes=A.clippingPlanes,x.clipIntersection=A.clipIntersection,x.displacementMap=A.displacementMap,x.displacementScale=A.displacementScale,x.displacementBias=A.displacementBias,x.wireframeLinewidth=A.wireframeLinewidth,x.linewidth=A.linewidth,C.isPointLight===!0&&x.isMeshDistanceMaterial===!0){const V=n.properties.get(x);V.light=C}return x}function S(E,A,C,w,x){if(E.visible===!1)return;if(E.layers.test(A.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&x===Wn)&&(!E.frustumCulled||i.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,E.matrixWorld);const O=e.update(E),R=E.material;if(Array.isArray(R)){const I=O.groups;for(let N=0,H=I.length;N<H;N++){const F=I[N],ee=R[F.materialIndex];if(ee&&ee.visible){const ne=y(E,ee,w,x);E.onBeforeShadow(n,E,A,C,O,ne,F),n.renderBufferDirect(C,null,O,ne,E,F),E.onAfterShadow(n,E,A,C,O,ne,F)}}}else if(R.visible){const I=y(E,R,w,x);E.onBeforeShadow(n,E,A,C,O,I,null),n.renderBufferDirect(C,null,O,I,E,null),E.onAfterShadow(n,E,A,C,O,I,null)}}const V=E.children;for(let O=0,R=V.length;O<R;O++)S(V[O],A,C,w,x)}function b(E){E.target.removeEventListener("dispose",b);for(const C in l){const w=l[C],x=E.target.uuid;x in w&&(w[x].dispose(),delete w[x])}}}function fx(n){function e(){let k=!1;const de=new wt;let Q=null;const te=new wt(0,0,0,0);return{setMask:function(me){Q!==me&&!k&&(n.colorMask(me,me,me,me),Q=me)},setLocked:function(me){k=me},setClear:function(me,De,Ze,_t,Tt){Tt===!0&&(me*=_t,De*=_t,Ze*=_t),de.set(me,De,Ze,_t),te.equals(de)===!1&&(n.clearColor(me,De,Ze,_t),te.copy(de))},reset:function(){k=!1,Q=null,te.set(-1,0,0,0)}}}function t(){let k=!1,de=null,Q=null,te=null;return{setTest:function(me){me?he(n.DEPTH_TEST):fe(n.DEPTH_TEST)},setMask:function(me){de!==me&&!k&&(n.depthMask(me),de=me)},setFunc:function(me){if(Q!==me){switch(me){case zm:n.depthFunc(n.NEVER);break;case Hm:n.depthFunc(n.ALWAYS);break;case Gm:n.depthFunc(n.LESS);break;case ha:n.depthFunc(n.LEQUAL);break;case Vm:n.depthFunc(n.EQUAL);break;case Wm:n.depthFunc(n.GEQUAL);break;case Xm:n.depthFunc(n.GREATER);break;case qm:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Q=me}},setLocked:function(me){k=me},setClear:function(me){te!==me&&(n.clearDepth(me),te=me)},reset:function(){k=!1,de=null,Q=null,te=null}}}function i(){let k=!1,de=null,Q=null,te=null,me=null,De=null,Ze=null,_t=null,Tt=null;return{setTest:function(Qe){k||(Qe?he(n.STENCIL_TEST):fe(n.STENCIL_TEST))},setMask:function(Qe){de!==Qe&&!k&&(n.stencilMask(Qe),de=Qe)},setFunc:function(Qe,Nn,Cn){(Q!==Qe||te!==Nn||me!==Cn)&&(n.stencilFunc(Qe,Nn,Cn),Q=Qe,te=Nn,me=Cn)},setOp:function(Qe,Nn,Cn){(De!==Qe||Ze!==Nn||_t!==Cn)&&(n.stencilOp(Qe,Nn,Cn),De=Qe,Ze=Nn,_t=Cn)},setLocked:function(Qe){k=Qe},setClear:function(Qe){Tt!==Qe&&(n.clearStencil(Qe),Tt=Qe)},reset:function(){k=!1,de=null,Q=null,te=null,me=null,De=null,Ze=null,_t=null,Tt=null}}}const r=new e,s=new t,o=new i,a=new WeakMap,c=new WeakMap;let l={},u={},f=new WeakMap,d=[],p=null,g=!1,_=null,h=null,m=null,v=null,y=null,S=null,b=null,E=new Ke(0,0,0),A=0,C=!1,w=null,x=null,P=null,V=null,O=null;const R=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let I=!1,N=0;const H=n.getParameter(n.VERSION);H.indexOf("WebGL")!==-1?(N=parseFloat(/^WebGL (\d)/.exec(H)[1]),I=N>=1):H.indexOf("OpenGL ES")!==-1&&(N=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),I=N>=2);let F=null,ee={};const ne=n.getParameter(n.SCISSOR_BOX),U=n.getParameter(n.VIEWPORT),K=new wt().fromArray(ne),se=new wt().fromArray(U);function X(k,de,Q,te){const me=new Uint8Array(4),De=n.createTexture();n.bindTexture(k,De),n.texParameteri(k,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(k,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ze=0;Ze<Q;Ze++)k===n.TEXTURE_3D||k===n.TEXTURE_2D_ARRAY?n.texImage3D(de,0,n.RGBA,1,1,te,0,n.RGBA,n.UNSIGNED_BYTE,me):n.texImage2D(de+Ze,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,me);return De}const j={};j[n.TEXTURE_2D]=X(n.TEXTURE_2D,n.TEXTURE_2D,1),j[n.TEXTURE_CUBE_MAP]=X(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),j[n.TEXTURE_2D_ARRAY]=X(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),j[n.TEXTURE_3D]=X(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),s.setClear(1),o.setClear(0),he(n.DEPTH_TEST),s.setFunc(ha),Ie(!1),Re(Gu),he(n.CULL_FACE),ct(vi);function he(k){l[k]!==!0&&(n.enable(k),l[k]=!0)}function fe(k){l[k]!==!1&&(n.disable(k),l[k]=!1)}function Ce(k,de){return u[k]!==de?(n.bindFramebuffer(k,de),u[k]=de,k===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=de),k===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=de),!0):!1}function Ne(k,de){let Q=d,te=!1;if(k){Q=f.get(de),Q===void 0&&(Q=[],f.set(de,Q));const me=k.textures;if(Q.length!==me.length||Q[0]!==n.COLOR_ATTACHMENT0){for(let De=0,Ze=me.length;De<Ze;De++)Q[De]=n.COLOR_ATTACHMENT0+De;Q.length=me.length,te=!0}}else Q[0]!==n.BACK&&(Q[0]=n.BACK,te=!0);te&&n.drawBuffers(Q)}function Se(k){return p!==k?(n.useProgram(k),p=k,!0):!1}const $e={[Vi]:n.FUNC_ADD,[Em]:n.FUNC_SUBTRACT,[wm]:n.FUNC_REVERSE_SUBTRACT};$e[bm]=n.MIN,$e[Tm]=n.MAX;const D={[Am]:n.ZERO,[Rm]:n.ONE,[Cm]:n.SRC_COLOR,[Jc]:n.SRC_ALPHA,[Nm]:n.SRC_ALPHA_SATURATE,[Dm]:n.DST_COLOR,[Lm]:n.DST_ALPHA,[Pm]:n.ONE_MINUS_SRC_COLOR,[Qc]:n.ONE_MINUS_SRC_ALPHA,[Um]:n.ONE_MINUS_DST_COLOR,[Im]:n.ONE_MINUS_DST_ALPHA,[Fm]:n.CONSTANT_COLOR,[km]:n.ONE_MINUS_CONSTANT_COLOR,[Om]:n.CONSTANT_ALPHA,[Bm]:n.ONE_MINUS_CONSTANT_ALPHA};function ct(k,de,Q,te,me,De,Ze,_t,Tt,Qe){if(k===vi){g===!0&&(fe(n.BLEND),g=!1);return}if(g===!1&&(he(n.BLEND),g=!0),k!==Mm){if(k!==_||Qe!==C){if((h!==Vi||y!==Vi)&&(n.blendEquation(n.FUNC_ADD),h=Vi,y=Vi),Qe)switch(k){case Nr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Vu:n.blendFunc(n.ONE,n.ONE);break;case Wu:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Xu:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}else switch(k){case Nr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Vu:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Wu:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Xu:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}m=null,v=null,S=null,b=null,E.set(0,0,0),A=0,_=k,C=Qe}return}me=me||de,De=De||Q,Ze=Ze||te,(de!==h||me!==y)&&(n.blendEquationSeparate($e[de],$e[me]),h=de,y=me),(Q!==m||te!==v||De!==S||Ze!==b)&&(n.blendFuncSeparate(D[Q],D[te],D[De],D[Ze]),m=Q,v=te,S=De,b=Ze),(_t.equals(E)===!1||Tt!==A)&&(n.blendColor(_t.r,_t.g,_t.b,Tt),E.copy(_t),A=Tt),_=k,C=!1}function Ye(k,de){k.side===En?fe(n.CULL_FACE):he(n.CULL_FACE);let Q=k.side===Bt;de&&(Q=!Q),Ie(Q),k.blending===Nr&&k.transparent===!1?ct(vi):ct(k.blending,k.blendEquation,k.blendSrc,k.blendDst,k.blendEquationAlpha,k.blendSrcAlpha,k.blendDstAlpha,k.blendColor,k.blendAlpha,k.premultipliedAlpha),s.setFunc(k.depthFunc),s.setTest(k.depthTest),s.setMask(k.depthWrite),r.setMask(k.colorWrite);const te=k.stencilWrite;o.setTest(te),te&&(o.setMask(k.stencilWriteMask),o.setFunc(k.stencilFunc,k.stencilRef,k.stencilFuncMask),o.setOp(k.stencilFail,k.stencilZFail,k.stencilZPass)),Fe(k.polygonOffset,k.polygonOffsetFactor,k.polygonOffsetUnits),k.alphaToCoverage===!0?he(n.SAMPLE_ALPHA_TO_COVERAGE):fe(n.SAMPLE_ALPHA_TO_COVERAGE)}function Ie(k){w!==k&&(k?n.frontFace(n.CW):n.frontFace(n.CCW),w=k)}function Re(k){k!==ym?(he(n.CULL_FACE),k!==x&&(k===Gu?n.cullFace(n.BACK):k===xm?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):fe(n.CULL_FACE),x=k}function dt(k){k!==P&&(I&&n.lineWidth(k),P=k)}function Fe(k,de,Q){k?(he(n.POLYGON_OFFSET_FILL),(V!==de||O!==Q)&&(n.polygonOffset(de,Q),V=de,O=Q)):fe(n.POLYGON_OFFSET_FILL)}function Be(k){k?he(n.SCISSOR_TEST):fe(n.SCISSOR_TEST)}function L(k){k===void 0&&(k=n.TEXTURE0+R-1),F!==k&&(n.activeTexture(k),F=k)}function M(k,de,Q){Q===void 0&&(F===null?Q=n.TEXTURE0+R-1:Q=F);let te=ee[Q];te===void 0&&(te={type:void 0,texture:void 0},ee[Q]=te),(te.type!==k||te.texture!==de)&&(F!==Q&&(n.activeTexture(Q),F=Q),n.bindTexture(k,de||j[k]),te.type=k,te.texture=de)}function Y(){const k=ee[F];k!==void 0&&k.type!==void 0&&(n.bindTexture(k.type,null),k.type=void 0,k.texture=void 0)}function re(){try{n.compressedTexImage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function oe(){try{n.compressedTexImage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function ie(){try{n.texSubImage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Le(){try{n.texSubImage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function ye(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Ee(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function He(){try{n.texStorage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function ue(){try{n.texStorage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function J(){try{n.texImage2D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function ge(){try{n.texImage3D.apply(n,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function _e(k){K.equals(k)===!1&&(n.scissor(k.x,k.y,k.z,k.w),K.copy(k))}function ce(k){se.equals(k)===!1&&(n.viewport(k.x,k.y,k.z,k.w),se.copy(k))}function ae(k,de){let Q=c.get(de);Q===void 0&&(Q=new WeakMap,c.set(de,Q));let te=Q.get(k);te===void 0&&(te=n.getUniformBlockIndex(de,k.name),Q.set(k,te))}function Te(k,de){const te=c.get(de).get(k);a.get(de)!==te&&(n.uniformBlockBinding(de,te,k.__bindingPointIndex),a.set(de,te))}function Xe(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),l={},F=null,ee={},u={},f=new WeakMap,d=[],p=null,g=!1,_=null,h=null,m=null,v=null,y=null,S=null,b=null,E=new Ke(0,0,0),A=0,C=!1,w=null,x=null,P=null,V=null,O=null,K.set(0,0,n.canvas.width,n.canvas.height),se.set(0,0,n.canvas.width,n.canvas.height),r.reset(),s.reset(),o.reset()}return{buffers:{color:r,depth:s,stencil:o},enable:he,disable:fe,bindFramebuffer:Ce,drawBuffers:Ne,useProgram:Se,setBlending:ct,setMaterial:Ye,setFlipSided:Ie,setCullFace:Re,setLineWidth:dt,setPolygonOffset:Fe,setScissorTest:Be,activeTexture:L,bindTexture:M,unbindTexture:Y,compressedTexImage2D:re,compressedTexImage3D:oe,texImage2D:J,texImage3D:ge,updateUBOMapping:ae,uniformBlockBinding:Te,texStorage2D:He,texStorage3D:ue,texSubImage2D:ie,texSubImage3D:Le,compressedTexSubImage2D:ye,compressedTexSubImage3D:Ee,scissor:_e,viewport:ce,reset:Xe}}function Fd(n,e,t,i){const r=hx(i);switch(t){case ph:return n*e;case gh:return n*e;case _h:return n*e*2;case vh:return n*e/r.components*r.byteLength;case nu:return n*e/r.components*r.byteLength;case yh:return n*e*2/r.components*r.byteLength;case iu:return n*e*2/r.components*r.byteLength;case mh:return n*e*3/r.components*r.byteLength;case bn:return n*e*4/r.components*r.byteLength;case ru:return n*e*4/r.components*r.byteLength;case ea:case ta:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case na:case ia:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case rl:case ol:return Math.max(n,16)*Math.max(e,8)/4;case il:case sl:return Math.max(n,8)*Math.max(e,8)/2;case al:case cl:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case ll:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ul:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case dl:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case fl:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case hl:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case pl:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case ml:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case gl:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case _l:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case vl:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case yl:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case xl:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Sl:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Ml:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case El:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case ra:case wl:case bl:return Math.ceil(n/4)*Math.ceil(e/4)*16;case xh:case Tl:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Al:case Rl:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function hx(n){switch(n){case Jn:case dh:return{byteLength:1,components:1};case Fs:case fh:case $s:return{byteLength:2,components:1};case eu:case tu:return{byteLength:2,components:4};case er:case Ql:case $n:return{byteLength:4,components:1};case hh:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}function px(n,e,t,i,r,s,o){const a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new qe,u=new WeakMap;let f;const d=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(L,M){return p?new OffscreenCanvas(L,M):ya("canvas")}function _(L,M,Y){let re=1;const oe=Be(L);if((oe.width>Y||oe.height>Y)&&(re=Y/Math.max(oe.width,oe.height)),re<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){const ie=Math.floor(re*oe.width),Le=Math.floor(re*oe.height);f===void 0&&(f=g(ie,Le));const ye=M?g(ie,Le):f;return ye.width=ie,ye.height=Le,ye.getContext("2d").drawImage(L,0,0,ie,Le),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+oe.width+"x"+oe.height+") to ("+ie+"x"+Le+")."),ye}else return"data"in L&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+oe.width+"x"+oe.height+")."),L;return L}function h(L){return L.generateMipmaps&&L.minFilter!==Ct&&L.minFilter!==wn}function m(L){n.generateMipmap(L)}function v(L,M,Y,re,oe=!1){if(L!==null){if(n[L]!==void 0)return n[L];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let ie=M;if(M===n.RED&&(Y===n.FLOAT&&(ie=n.R32F),Y===n.HALF_FLOAT&&(ie=n.R16F),Y===n.UNSIGNED_BYTE&&(ie=n.R8)),M===n.RED_INTEGER&&(Y===n.UNSIGNED_BYTE&&(ie=n.R8UI),Y===n.UNSIGNED_SHORT&&(ie=n.R16UI),Y===n.UNSIGNED_INT&&(ie=n.R32UI),Y===n.BYTE&&(ie=n.R8I),Y===n.SHORT&&(ie=n.R16I),Y===n.INT&&(ie=n.R32I)),M===n.RG&&(Y===n.FLOAT&&(ie=n.RG32F),Y===n.HALF_FLOAT&&(ie=n.RG16F),Y===n.UNSIGNED_BYTE&&(ie=n.RG8)),M===n.RG_INTEGER&&(Y===n.UNSIGNED_BYTE&&(ie=n.RG8UI),Y===n.UNSIGNED_SHORT&&(ie=n.RG16UI),Y===n.UNSIGNED_INT&&(ie=n.RG32UI),Y===n.BYTE&&(ie=n.RG8I),Y===n.SHORT&&(ie=n.RG16I),Y===n.INT&&(ie=n.RG32I)),M===n.RGB&&Y===n.UNSIGNED_INT_5_9_9_9_REV&&(ie=n.RGB9_E5),M===n.RGBA){const Le=oe?ma:st.getTransfer(re);Y===n.FLOAT&&(ie=n.RGBA32F),Y===n.HALF_FLOAT&&(ie=n.RGBA16F),Y===n.UNSIGNED_BYTE&&(ie=Le===lt?n.SRGB8_ALPHA8:n.RGBA8),Y===n.UNSIGNED_SHORT_4_4_4_4&&(ie=n.RGBA4),Y===n.UNSIGNED_SHORT_5_5_5_1&&(ie=n.RGB5_A1)}return(ie===n.R16F||ie===n.R32F||ie===n.RG16F||ie===n.RG32F||ie===n.RGBA16F||ie===n.RGBA32F)&&e.get("EXT_color_buffer_float"),ie}function y(L,M){let Y;return L?M===null||M===er||M===Wr?Y=n.DEPTH24_STENCIL8:M===$n?Y=n.DEPTH32F_STENCIL8:M===Fs&&(Y=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===er||M===Wr?Y=n.DEPTH_COMPONENT24:M===$n?Y=n.DEPTH_COMPONENT32F:M===Fs&&(Y=n.DEPTH_COMPONENT16),Y}function S(L,M){return h(L)===!0||L.isFramebufferTexture&&L.minFilter!==Ct&&L.minFilter!==wn?Math.log2(Math.max(M.width,M.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?M.mipmaps.length:1}function b(L){const M=L.target;M.removeEventListener("dispose",b),A(M),M.isVideoTexture&&u.delete(M)}function E(L){const M=L.target;M.removeEventListener("dispose",E),w(M)}function A(L){const M=i.get(L);if(M.__webglInit===void 0)return;const Y=L.source,re=d.get(Y);if(re){const oe=re[M.__cacheKey];oe.usedTimes--,oe.usedTimes===0&&C(L),Object.keys(re).length===0&&d.delete(Y)}i.remove(L)}function C(L){const M=i.get(L);n.deleteTexture(M.__webglTexture);const Y=L.source,re=d.get(Y);delete re[M.__cacheKey],o.memory.textures--}function w(L){const M=i.get(L);if(L.depthTexture&&L.depthTexture.dispose(),L.isWebGLCubeRenderTarget)for(let re=0;re<6;re++){if(Array.isArray(M.__webglFramebuffer[re]))for(let oe=0;oe<M.__webglFramebuffer[re].length;oe++)n.deleteFramebuffer(M.__webglFramebuffer[re][oe]);else n.deleteFramebuffer(M.__webglFramebuffer[re]);M.__webglDepthbuffer&&n.deleteRenderbuffer(M.__webglDepthbuffer[re])}else{if(Array.isArray(M.__webglFramebuffer))for(let re=0;re<M.__webglFramebuffer.length;re++)n.deleteFramebuffer(M.__webglFramebuffer[re]);else n.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&n.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&n.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let re=0;re<M.__webglColorRenderbuffer.length;re++)M.__webglColorRenderbuffer[re]&&n.deleteRenderbuffer(M.__webglColorRenderbuffer[re]);M.__webglDepthRenderbuffer&&n.deleteRenderbuffer(M.__webglDepthRenderbuffer)}const Y=L.textures;for(let re=0,oe=Y.length;re<oe;re++){const ie=i.get(Y[re]);ie.__webglTexture&&(n.deleteTexture(ie.__webglTexture),o.memory.textures--),i.remove(Y[re])}i.remove(L)}let x=0;function P(){x=0}function V(){const L=x;return L>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+L+" texture units while this GPU supports only "+r.maxTextures),x+=1,L}function O(L){const M=[];return M.push(L.wrapS),M.push(L.wrapT),M.push(L.wrapR||0),M.push(L.magFilter),M.push(L.minFilter),M.push(L.anisotropy),M.push(L.internalFormat),M.push(L.format),M.push(L.type),M.push(L.generateMipmaps),M.push(L.premultiplyAlpha),M.push(L.flipY),M.push(L.unpackAlignment),M.push(L.colorSpace),M.join()}function R(L,M){const Y=i.get(L);if(L.isVideoTexture&&dt(L),L.isRenderTargetTexture===!1&&L.version>0&&Y.__version!==L.version){const re=L.image;if(re===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(re.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{se(Y,L,M);return}}t.bindTexture(n.TEXTURE_2D,Y.__webglTexture,n.TEXTURE0+M)}function I(L,M){const Y=i.get(L);if(L.version>0&&Y.__version!==L.version){se(Y,L,M);return}t.bindTexture(n.TEXTURE_2D_ARRAY,Y.__webglTexture,n.TEXTURE0+M)}function N(L,M){const Y=i.get(L);if(L.version>0&&Y.__version!==L.version){se(Y,L,M);return}t.bindTexture(n.TEXTURE_3D,Y.__webglTexture,n.TEXTURE0+M)}function H(L,M){const Y=i.get(L);if(L.version>0&&Y.__version!==L.version){X(Y,L,M);return}t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture,n.TEXTURE0+M)}const F={[pa]:n.REPEAT,[Xi]:n.CLAMP_TO_EDGE,[nl]:n.MIRRORED_REPEAT},ee={[Ct]:n.NEAREST,[ng]:n.NEAREST_MIPMAP_NEAREST,[fo]:n.NEAREST_MIPMAP_LINEAR,[wn]:n.LINEAR,[ec]:n.LINEAR_MIPMAP_NEAREST,[qi]:n.LINEAR_MIPMAP_LINEAR},ne={[ag]:n.NEVER,[hg]:n.ALWAYS,[cg]:n.LESS,[Sh]:n.LEQUAL,[lg]:n.EQUAL,[fg]:n.GEQUAL,[ug]:n.GREATER,[dg]:n.NOTEQUAL};function U(L,M){if(M.type===$n&&e.has("OES_texture_float_linear")===!1&&(M.magFilter===wn||M.magFilter===ec||M.magFilter===fo||M.magFilter===qi||M.minFilter===wn||M.minFilter===ec||M.minFilter===fo||M.minFilter===qi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(L,n.TEXTURE_WRAP_S,F[M.wrapS]),n.texParameteri(L,n.TEXTURE_WRAP_T,F[M.wrapT]),(L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY)&&n.texParameteri(L,n.TEXTURE_WRAP_R,F[M.wrapR]),n.texParameteri(L,n.TEXTURE_MAG_FILTER,ee[M.magFilter]),n.texParameteri(L,n.TEXTURE_MIN_FILTER,ee[M.minFilter]),M.compareFunction&&(n.texParameteri(L,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(L,n.TEXTURE_COMPARE_FUNC,ne[M.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===Ct||M.minFilter!==fo&&M.minFilter!==qi||M.type===$n&&e.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||i.get(M).__currentAnisotropy){const Y=e.get("EXT_texture_filter_anisotropic");n.texParameterf(L,Y.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,r.getMaxAnisotropy())),i.get(M).__currentAnisotropy=M.anisotropy}}}function K(L,M){let Y=!1;L.__webglInit===void 0&&(L.__webglInit=!0,M.addEventListener("dispose",b));const re=M.source;let oe=d.get(re);oe===void 0&&(oe={},d.set(re,oe));const ie=O(M);if(ie!==L.__cacheKey){oe[ie]===void 0&&(oe[ie]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,Y=!0),oe[ie].usedTimes++;const Le=oe[L.__cacheKey];Le!==void 0&&(oe[L.__cacheKey].usedTimes--,Le.usedTimes===0&&C(M)),L.__cacheKey=ie,L.__webglTexture=oe[ie].texture}return Y}function se(L,M,Y){let re=n.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(re=n.TEXTURE_2D_ARRAY),M.isData3DTexture&&(re=n.TEXTURE_3D);const oe=K(L,M),ie=M.source;t.bindTexture(re,L.__webglTexture,n.TEXTURE0+Y);const Le=i.get(ie);if(ie.version!==Le.__version||oe===!0){t.activeTexture(n.TEXTURE0+Y);const ye=st.getPrimaries(st.workingColorSpace),Ee=M.colorSpace===fi?null:st.getPrimaries(M.colorSpace),He=M.colorSpace===fi||ye===Ee?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,He);let ue=_(M.image,!1,r.maxTextureSize);ue=Fe(M,ue);const J=s.convert(M.format,M.colorSpace),ge=s.convert(M.type);let _e=v(M.internalFormat,J,ge,M.colorSpace,M.isVideoTexture);U(re,M);let ce;const ae=M.mipmaps,Te=M.isVideoTexture!==!0,Xe=Le.__version===void 0||oe===!0,k=ie.dataReady,de=S(M,ue);if(M.isDepthTexture)_e=y(M.format===Xr,M.type),Xe&&(Te?t.texStorage2D(n.TEXTURE_2D,1,_e,ue.width,ue.height):t.texImage2D(n.TEXTURE_2D,0,_e,ue.width,ue.height,0,J,ge,null));else if(M.isDataTexture)if(ae.length>0){Te&&Xe&&t.texStorage2D(n.TEXTURE_2D,de,_e,ae[0].width,ae[0].height);for(let Q=0,te=ae.length;Q<te;Q++)ce=ae[Q],Te?k&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,ce.width,ce.height,J,ge,ce.data):t.texImage2D(n.TEXTURE_2D,Q,_e,ce.width,ce.height,0,J,ge,ce.data);M.generateMipmaps=!1}else Te?(Xe&&t.texStorage2D(n.TEXTURE_2D,de,_e,ue.width,ue.height),k&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ue.width,ue.height,J,ge,ue.data)):t.texImage2D(n.TEXTURE_2D,0,_e,ue.width,ue.height,0,J,ge,ue.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Te&&Xe&&t.texStorage3D(n.TEXTURE_2D_ARRAY,de,_e,ae[0].width,ae[0].height,ue.depth);for(let Q=0,te=ae.length;Q<te;Q++)if(ce=ae[Q],M.format!==bn)if(J!==null)if(Te){if(k)if(M.layerUpdates.size>0){const me=Fd(ce.width,ce.height,M.format,M.type);for(const De of M.layerUpdates){const Ze=ce.data.subarray(De*me/ce.data.BYTES_PER_ELEMENT,(De+1)*me/ce.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,De,ce.width,ce.height,1,J,Ze,0,0)}M.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,ce.width,ce.height,ue.depth,J,ce.data,0,0)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Q,_e,ce.width,ce.height,ue.depth,0,ce.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Te?k&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,ce.width,ce.height,ue.depth,J,ge,ce.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Q,_e,ce.width,ce.height,ue.depth,0,J,ge,ce.data)}else{Te&&Xe&&t.texStorage2D(n.TEXTURE_2D,de,_e,ae[0].width,ae[0].height);for(let Q=0,te=ae.length;Q<te;Q++)ce=ae[Q],M.format!==bn?J!==null?Te?k&&t.compressedTexSubImage2D(n.TEXTURE_2D,Q,0,0,ce.width,ce.height,J,ce.data):t.compressedTexImage2D(n.TEXTURE_2D,Q,_e,ce.width,ce.height,0,ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Te?k&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,ce.width,ce.height,J,ge,ce.data):t.texImage2D(n.TEXTURE_2D,Q,_e,ce.width,ce.height,0,J,ge,ce.data)}else if(M.isDataArrayTexture)if(Te){if(Xe&&t.texStorage3D(n.TEXTURE_2D_ARRAY,de,_e,ue.width,ue.height,ue.depth),k)if(M.layerUpdates.size>0){const Q=Fd(ue.width,ue.height,M.format,M.type);for(const te of M.layerUpdates){const me=ue.data.subarray(te*Q/ue.data.BYTES_PER_ELEMENT,(te+1)*Q/ue.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,te,ue.width,ue.height,1,J,ge,me)}M.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ue.width,ue.height,ue.depth,J,ge,ue.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,_e,ue.width,ue.height,ue.depth,0,J,ge,ue.data);else if(M.isData3DTexture)Te?(Xe&&t.texStorage3D(n.TEXTURE_3D,de,_e,ue.width,ue.height,ue.depth),k&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ue.width,ue.height,ue.depth,J,ge,ue.data)):t.texImage3D(n.TEXTURE_3D,0,_e,ue.width,ue.height,ue.depth,0,J,ge,ue.data);else if(M.isFramebufferTexture){if(Xe)if(Te)t.texStorage2D(n.TEXTURE_2D,de,_e,ue.width,ue.height);else{let Q=ue.width,te=ue.height;for(let me=0;me<de;me++)t.texImage2D(n.TEXTURE_2D,me,_e,Q,te,0,J,ge,null),Q>>=1,te>>=1}}else if(ae.length>0){if(Te&&Xe){const Q=Be(ae[0]);t.texStorage2D(n.TEXTURE_2D,de,_e,Q.width,Q.height)}for(let Q=0,te=ae.length;Q<te;Q++)ce=ae[Q],Te?k&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,J,ge,ce):t.texImage2D(n.TEXTURE_2D,Q,_e,J,ge,ce);M.generateMipmaps=!1}else if(Te){if(Xe){const Q=Be(ue);t.texStorage2D(n.TEXTURE_2D,de,_e,Q.width,Q.height)}k&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,J,ge,ue)}else t.texImage2D(n.TEXTURE_2D,0,_e,J,ge,ue);h(M)&&m(re),Le.__version=ie.version,M.onUpdate&&M.onUpdate(M)}L.__version=M.version}function X(L,M,Y){if(M.image.length!==6)return;const re=K(L,M),oe=M.source;t.bindTexture(n.TEXTURE_CUBE_MAP,L.__webglTexture,n.TEXTURE0+Y);const ie=i.get(oe);if(oe.version!==ie.__version||re===!0){t.activeTexture(n.TEXTURE0+Y);const Le=st.getPrimaries(st.workingColorSpace),ye=M.colorSpace===fi?null:st.getPrimaries(M.colorSpace),Ee=M.colorSpace===fi||Le===ye?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee);const He=M.isCompressedTexture||M.image[0].isCompressedTexture,ue=M.image[0]&&M.image[0].isDataTexture,J=[];for(let te=0;te<6;te++)!He&&!ue?J[te]=_(M.image[te],!0,r.maxCubemapSize):J[te]=ue?M.image[te].image:M.image[te],J[te]=Fe(M,J[te]);const ge=J[0],_e=s.convert(M.format,M.colorSpace),ce=s.convert(M.type),ae=v(M.internalFormat,_e,ce,M.colorSpace),Te=M.isVideoTexture!==!0,Xe=ie.__version===void 0||re===!0,k=oe.dataReady;let de=S(M,ge);U(n.TEXTURE_CUBE_MAP,M);let Q;if(He){Te&&Xe&&t.texStorage2D(n.TEXTURE_CUBE_MAP,de,ae,ge.width,ge.height);for(let te=0;te<6;te++){Q=J[te].mipmaps;for(let me=0;me<Q.length;me++){const De=Q[me];M.format!==bn?_e!==null?Te?k&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,me,0,0,De.width,De.height,_e,De.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,me,ae,De.width,De.height,0,De.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Te?k&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,me,0,0,De.width,De.height,_e,ce,De.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,me,ae,De.width,De.height,0,_e,ce,De.data)}}}else{if(Q=M.mipmaps,Te&&Xe){Q.length>0&&de++;const te=Be(J[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,de,ae,te.width,te.height)}for(let te=0;te<6;te++)if(ue){Te?k&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,J[te].width,J[te].height,_e,ce,J[te].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,ae,J[te].width,J[te].height,0,_e,ce,J[te].data);for(let me=0;me<Q.length;me++){const Ze=Q[me].image[te].image;Te?k&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,me+1,0,0,Ze.width,Ze.height,_e,ce,Ze.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,me+1,ae,Ze.width,Ze.height,0,_e,ce,Ze.data)}}else{Te?k&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,_e,ce,J[te]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,ae,_e,ce,J[te]);for(let me=0;me<Q.length;me++){const De=Q[me];Te?k&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,me+1,0,0,_e,ce,De.image[te]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,me+1,ae,_e,ce,De.image[te])}}}h(M)&&m(n.TEXTURE_CUBE_MAP),ie.__version=oe.version,M.onUpdate&&M.onUpdate(M)}L.__version=M.version}function j(L,M,Y,re,oe,ie){const Le=s.convert(Y.format,Y.colorSpace),ye=s.convert(Y.type),Ee=v(Y.internalFormat,Le,ye,Y.colorSpace);if(!i.get(M).__hasExternalTextures){const ue=Math.max(1,M.width>>ie),J=Math.max(1,M.height>>ie);oe===n.TEXTURE_3D||oe===n.TEXTURE_2D_ARRAY?t.texImage3D(oe,ie,Ee,ue,J,M.depth,0,Le,ye,null):t.texImage2D(oe,ie,Ee,ue,J,0,Le,ye,null)}t.bindFramebuffer(n.FRAMEBUFFER,L),Re(M)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,re,oe,i.get(Y).__webglTexture,0,Ie(M)):(oe===n.TEXTURE_2D||oe>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&oe<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,re,oe,i.get(Y).__webglTexture,ie),t.bindFramebuffer(n.FRAMEBUFFER,null)}function he(L,M,Y){if(n.bindRenderbuffer(n.RENDERBUFFER,L),M.depthBuffer){const re=M.depthTexture,oe=re&&re.isDepthTexture?re.type:null,ie=y(M.stencilBuffer,oe),Le=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ye=Ie(M);Re(M)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ye,ie,M.width,M.height):Y?n.renderbufferStorageMultisample(n.RENDERBUFFER,ye,ie,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,ie,M.width,M.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Le,n.RENDERBUFFER,L)}else{const re=M.textures;for(let oe=0;oe<re.length;oe++){const ie=re[oe],Le=s.convert(ie.format,ie.colorSpace),ye=s.convert(ie.type),Ee=v(ie.internalFormat,Le,ye,ie.colorSpace),He=Ie(M);Y&&Re(M)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,He,Ee,M.width,M.height):Re(M)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,He,Ee,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,Ee,M.width,M.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function fe(L,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,L),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),R(M.depthTexture,0);const re=i.get(M.depthTexture).__webglTexture,oe=Ie(M);if(M.depthTexture.format===Fr)Re(M)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,re,0,oe):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,re,0);else if(M.depthTexture.format===Xr)Re(M)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,re,0,oe):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,re,0);else throw new Error("Unknown depthTexture format")}function Ce(L){const M=i.get(L),Y=L.isWebGLCubeRenderTarget===!0;if(L.depthTexture&&!M.__autoAllocateDepthBuffer){if(Y)throw new Error("target.depthTexture not supported in Cube render targets");fe(M.__webglFramebuffer,L)}else if(Y){M.__webglDepthbuffer=[];for(let re=0;re<6;re++)t.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer[re]),M.__webglDepthbuffer[re]=n.createRenderbuffer(),he(M.__webglDepthbuffer[re],L,!1)}else t.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=n.createRenderbuffer(),he(M.__webglDepthbuffer,L,!1);t.bindFramebuffer(n.FRAMEBUFFER,null)}function Ne(L,M,Y){const re=i.get(L);M!==void 0&&j(re.__webglFramebuffer,L,L.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),Y!==void 0&&Ce(L)}function Se(L){const M=L.texture,Y=i.get(L),re=i.get(M);L.addEventListener("dispose",E);const oe=L.textures,ie=L.isWebGLCubeRenderTarget===!0,Le=oe.length>1;if(Le||(re.__webglTexture===void 0&&(re.__webglTexture=n.createTexture()),re.__version=M.version,o.memory.textures++),ie){Y.__webglFramebuffer=[];for(let ye=0;ye<6;ye++)if(M.mipmaps&&M.mipmaps.length>0){Y.__webglFramebuffer[ye]=[];for(let Ee=0;Ee<M.mipmaps.length;Ee++)Y.__webglFramebuffer[ye][Ee]=n.createFramebuffer()}else Y.__webglFramebuffer[ye]=n.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){Y.__webglFramebuffer=[];for(let ye=0;ye<M.mipmaps.length;ye++)Y.__webglFramebuffer[ye]=n.createFramebuffer()}else Y.__webglFramebuffer=n.createFramebuffer();if(Le)for(let ye=0,Ee=oe.length;ye<Ee;ye++){const He=i.get(oe[ye]);He.__webglTexture===void 0&&(He.__webglTexture=n.createTexture(),o.memory.textures++)}if(L.samples>0&&Re(L)===!1){Y.__webglMultisampledFramebuffer=n.createFramebuffer(),Y.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,Y.__webglMultisampledFramebuffer);for(let ye=0;ye<oe.length;ye++){const Ee=oe[ye];Y.__webglColorRenderbuffer[ye]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,Y.__webglColorRenderbuffer[ye]);const He=s.convert(Ee.format,Ee.colorSpace),ue=s.convert(Ee.type),J=v(Ee.internalFormat,He,ue,Ee.colorSpace,L.isXRRenderTarget===!0),ge=Ie(L);n.renderbufferStorageMultisample(n.RENDERBUFFER,ge,J,L.width,L.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ye,n.RENDERBUFFER,Y.__webglColorRenderbuffer[ye])}n.bindRenderbuffer(n.RENDERBUFFER,null),L.depthBuffer&&(Y.__webglDepthRenderbuffer=n.createRenderbuffer(),he(Y.__webglDepthRenderbuffer,L,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ie){t.bindTexture(n.TEXTURE_CUBE_MAP,re.__webglTexture),U(n.TEXTURE_CUBE_MAP,M);for(let ye=0;ye<6;ye++)if(M.mipmaps&&M.mipmaps.length>0)for(let Ee=0;Ee<M.mipmaps.length;Ee++)j(Y.__webglFramebuffer[ye][Ee],L,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ye,Ee);else j(Y.__webglFramebuffer[ye],L,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ye,0);h(M)&&m(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Le){for(let ye=0,Ee=oe.length;ye<Ee;ye++){const He=oe[ye],ue=i.get(He);t.bindTexture(n.TEXTURE_2D,ue.__webglTexture),U(n.TEXTURE_2D,He),j(Y.__webglFramebuffer,L,He,n.COLOR_ATTACHMENT0+ye,n.TEXTURE_2D,0),h(He)&&m(n.TEXTURE_2D)}t.unbindTexture()}else{let ye=n.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(ye=L.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ye,re.__webglTexture),U(ye,M),M.mipmaps&&M.mipmaps.length>0)for(let Ee=0;Ee<M.mipmaps.length;Ee++)j(Y.__webglFramebuffer[Ee],L,M,n.COLOR_ATTACHMENT0,ye,Ee);else j(Y.__webglFramebuffer,L,M,n.COLOR_ATTACHMENT0,ye,0);h(M)&&m(ye),t.unbindTexture()}L.depthBuffer&&Ce(L)}function $e(L){const M=L.textures;for(let Y=0,re=M.length;Y<re;Y++){const oe=M[Y];if(h(oe)){const ie=L.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,Le=i.get(oe).__webglTexture;t.bindTexture(ie,Le),m(ie),t.unbindTexture()}}}const D=[],ct=[];function Ye(L){if(L.samples>0){if(Re(L)===!1){const M=L.textures,Y=L.width,re=L.height;let oe=n.COLOR_BUFFER_BIT;const ie=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Le=i.get(L),ye=M.length>1;if(ye)for(let Ee=0;Ee<M.length;Ee++)t.bindFramebuffer(n.FRAMEBUFFER,Le.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ee,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Le.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ee,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Le.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Le.__webglFramebuffer);for(let Ee=0;Ee<M.length;Ee++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(oe|=n.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(oe|=n.STENCIL_BUFFER_BIT)),ye){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Le.__webglColorRenderbuffer[Ee]);const He=i.get(M[Ee]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,He,0)}n.blitFramebuffer(0,0,Y,re,0,0,Y,re,oe,n.NEAREST),c===!0&&(D.length=0,ct.length=0,D.push(n.COLOR_ATTACHMENT0+Ee),L.depthBuffer&&L.resolveDepthBuffer===!1&&(D.push(ie),ct.push(ie),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,ct)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,D))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ye)for(let Ee=0;Ee<M.length;Ee++){t.bindFramebuffer(n.FRAMEBUFFER,Le.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ee,n.RENDERBUFFER,Le.__webglColorRenderbuffer[Ee]);const He=i.get(M[Ee]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Le.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ee,n.TEXTURE_2D,He,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Le.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.resolveDepthBuffer===!1&&c){const M=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[M])}}}function Ie(L){return Math.min(r.maxSamples,L.samples)}function Re(L){const M=i.get(L);return L.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function dt(L){const M=o.render.frame;u.get(L)!==M&&(u.set(L,M),L.update())}function Fe(L,M){const Y=L.colorSpace,re=L.format,oe=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||Y!==Ti&&Y!==fi&&(st.getTransfer(Y)===lt?(re!==bn||oe!==Jn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",Y)),M}function Be(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(l.width=L.naturalWidth||L.width,l.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(l.width=L.displayWidth,l.height=L.displayHeight):(l.width=L.width,l.height=L.height),l}this.allocateTextureUnit=V,this.resetTextureUnits=P,this.setTexture2D=R,this.setTexture2DArray=I,this.setTexture3D=N,this.setTextureCube=H,this.rebindTextures=Ne,this.setupRenderTarget=Se,this.updateRenderTargetMipmap=$e,this.updateMultisampleRenderTarget=Ye,this.setupDepthRenderbuffer=Ce,this.setupFrameBufferTexture=j,this.useMultisampledRTT=Re}function mx(n,e){function t(i,r=fi){let s;const o=st.getTransfer(r);if(i===Jn)return n.UNSIGNED_BYTE;if(i===eu)return n.UNSIGNED_SHORT_4_4_4_4;if(i===tu)return n.UNSIGNED_SHORT_5_5_5_1;if(i===hh)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===dh)return n.BYTE;if(i===fh)return n.SHORT;if(i===Fs)return n.UNSIGNED_SHORT;if(i===Ql)return n.INT;if(i===er)return n.UNSIGNED_INT;if(i===$n)return n.FLOAT;if(i===$s)return n.HALF_FLOAT;if(i===ph)return n.ALPHA;if(i===mh)return n.RGB;if(i===bn)return n.RGBA;if(i===gh)return n.LUMINANCE;if(i===_h)return n.LUMINANCE_ALPHA;if(i===Fr)return n.DEPTH_COMPONENT;if(i===Xr)return n.DEPTH_STENCIL;if(i===vh)return n.RED;if(i===nu)return n.RED_INTEGER;if(i===yh)return n.RG;if(i===iu)return n.RG_INTEGER;if(i===ru)return n.RGBA_INTEGER;if(i===ea||i===ta||i===na||i===ia)if(o===lt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ea)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ta)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===na)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===ia)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ea)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ta)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===na)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===ia)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===il||i===rl||i===sl||i===ol)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===il)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===rl)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===sl)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ol)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===al||i===cl||i===ll)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===al||i===cl)return o===lt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===ll)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===ul||i===dl||i===fl||i===hl||i===pl||i===ml||i===gl||i===_l||i===vl||i===yl||i===xl||i===Sl||i===Ml||i===El)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===ul)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===dl)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===fl)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===hl)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===pl)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ml)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===gl)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===_l)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===vl)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===yl)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===xl)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Sl)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ml)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===El)return o===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ra||i===wl||i===bl)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===ra)return o===lt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===wl)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===bl)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===xh||i===Tl||i===Al||i===Rl)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===ra)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Tl)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Al)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Rl)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Wr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}class gx extends sn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class $i extends Dt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const _x={type:"move"};class Tc{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new $i,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new $i,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new W,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new W),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new $i,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new W,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new W),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(const _ of e.hand.values()){const h=t.getJointPose(_,i),m=this._getHandJoint(l,_);h!==null&&(m.matrix.fromArray(h.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=h.radius),m.visible=h!==null}const u=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],d=u.position.distanceTo(f.position),p=.02,g=.005;l.inputState.pinching&&d>p+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=p-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(_x)))}return a!==null&&(a.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new $i;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const vx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,yx=`
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

}`;class xx{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){const r=new zt,s=e.properties.get(r);s.__webglTexture=t.texture,(t.depthNear!=i.depthNear||t.depthFar!=i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new wi({vertexShader:vx,fragmentShader:yx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Wt(new Zs(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Sx extends Qr{constructor(e,t){super();const i=this;let r=null,s=1,o=null,a="local-floor",c=1,l=null,u=null,f=null,d=null,p=null,g=null;const _=new xx,h=t.getContextAttributes();let m=null,v=null;const y=[],S=[],b=new qe;let E=null;const A=new sn;A.layers.enable(1),A.viewport=new wt;const C=new sn;C.layers.enable(2),C.viewport=new wt;const w=[A,C],x=new gx;x.layers.enable(1),x.layers.enable(2);let P=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let j=y[X];return j===void 0&&(j=new Tc,y[X]=j),j.getTargetRaySpace()},this.getControllerGrip=function(X){let j=y[X];return j===void 0&&(j=new Tc,y[X]=j),j.getGripSpace()},this.getHand=function(X){let j=y[X];return j===void 0&&(j=new Tc,y[X]=j),j.getHandSpace()};function O(X){const j=S.indexOf(X.inputSource);if(j===-1)return;const he=y[j];he!==void 0&&(he.update(X.inputSource,X.frame,l||o),he.dispatchEvent({type:X.type,data:X.inputSource}))}function R(){r.removeEventListener("select",O),r.removeEventListener("selectstart",O),r.removeEventListener("selectend",O),r.removeEventListener("squeeze",O),r.removeEventListener("squeezestart",O),r.removeEventListener("squeezeend",O),r.removeEventListener("end",R),r.removeEventListener("inputsourceschange",I);for(let X=0;X<y.length;X++){const j=S[X];j!==null&&(S[X]=null,y[X].disconnect(j))}P=null,V=null,_.reset(),e.setRenderTarget(m),p=null,d=null,f=null,r=null,v=null,se.stop(),i.isPresenting=!1,e.setPixelRatio(E),e.setSize(b.width,b.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){s=X,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){a=X,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(X){l=X},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return f},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(X){if(r=X,r!==null){if(m=e.getRenderTarget(),r.addEventListener("select",O),r.addEventListener("selectstart",O),r.addEventListener("selectend",O),r.addEventListener("squeeze",O),r.addEventListener("squeezestart",O),r.addEventListener("squeezeend",O),r.addEventListener("end",R),r.addEventListener("inputsourceschange",I),h.xrCompatible!==!0&&await t.makeXRCompatible(),E=e.getPixelRatio(),e.getSize(b),r.renderState.layers===void 0){const j={antialias:h.antialias,alpha:!0,depth:h.depth,stencil:h.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,t,j),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),v=new tr(p.framebufferWidth,p.framebufferHeight,{format:bn,type:Jn,colorSpace:e.outputColorSpace,stencilBuffer:h.stencil})}else{let j=null,he=null,fe=null;h.depth&&(fe=h.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,j=h.stencil?Xr:Fr,he=h.stencil?Wr:er);const Ce={colorFormat:t.RGBA8,depthFormat:fe,scaleFactor:s};f=new XRWebGLBinding(r,t),d=f.createProjectionLayer(Ce),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),v=new tr(d.textureWidth,d.textureHeight,{format:bn,type:Jn,depthTexture:new Uh(d.textureWidth,d.textureHeight,he,void 0,void 0,void 0,void 0,void 0,void 0,j),stencilBuffer:h.stencil,colorSpace:e.outputColorSpace,samples:h.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await r.requestReferenceSpace(a),se.setContext(r),se.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function I(X){for(let j=0;j<X.removed.length;j++){const he=X.removed[j],fe=S.indexOf(he);fe>=0&&(S[fe]=null,y[fe].disconnect(he))}for(let j=0;j<X.added.length;j++){const he=X.added[j];let fe=S.indexOf(he);if(fe===-1){for(let Ne=0;Ne<y.length;Ne++)if(Ne>=S.length){S.push(he),fe=Ne;break}else if(S[Ne]===null){S[Ne]=he,fe=Ne;break}if(fe===-1)break}const Ce=y[fe];Ce&&Ce.connect(he)}}const N=new W,H=new W;function F(X,j,he){N.setFromMatrixPosition(j.matrixWorld),H.setFromMatrixPosition(he.matrixWorld);const fe=N.distanceTo(H),Ce=j.projectionMatrix.elements,Ne=he.projectionMatrix.elements,Se=Ce[14]/(Ce[10]-1),$e=Ce[14]/(Ce[10]+1),D=(Ce[9]+1)/Ce[5],ct=(Ce[9]-1)/Ce[5],Ye=(Ce[8]-1)/Ce[0],Ie=(Ne[8]+1)/Ne[0],Re=Se*Ye,dt=Se*Ie,Fe=fe/(-Ye+Ie),Be=Fe*-Ye;j.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(Be),X.translateZ(Fe),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert();const L=Se+Fe,M=$e+Fe,Y=Re-Be,re=dt+(fe-Be),oe=D*$e/M*L,ie=ct*$e/M*L;X.projectionMatrix.makePerspective(Y,re,oe,ie,L,M),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}function ee(X,j){j===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(j.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(r===null)return;_.texture!==null&&(X.near=_.depthNear,X.far=_.depthFar),x.near=C.near=A.near=X.near,x.far=C.far=A.far=X.far,(P!==x.near||V!==x.far)&&(r.updateRenderState({depthNear:x.near,depthFar:x.far}),P=x.near,V=x.far,A.near=P,A.far=V,C.near=P,C.far=V,A.updateProjectionMatrix(),C.updateProjectionMatrix(),X.updateProjectionMatrix());const j=X.parent,he=x.cameras;ee(x,j);for(let fe=0;fe<he.length;fe++)ee(he[fe],j);he.length===2?F(x,A,C):x.projectionMatrix.copy(A.projectionMatrix),ne(X,x,j)};function ne(X,j,he){he===null?X.matrix.copy(j.matrixWorld):(X.matrix.copy(he.matrixWorld),X.matrix.invert(),X.matrix.multiply(j.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(j.projectionMatrix),X.projectionMatrixInverse.copy(j.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=Pl*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(d===null&&p===null))return c},this.setFoveation=function(X){c=X,d!==null&&(d.fixedFoveation=X),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=X)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(x)};let U=null;function K(X,j){if(u=j.getViewerPose(l||o),g=j,u!==null){const he=u.views;p!==null&&(e.setRenderTargetFramebuffer(v,p.framebuffer),e.setRenderTarget(v));let fe=!1;he.length!==x.cameras.length&&(x.cameras.length=0,fe=!0);for(let Ne=0;Ne<he.length;Ne++){const Se=he[Ne];let $e=null;if(p!==null)$e=p.getViewport(Se);else{const ct=f.getViewSubImage(d,Se);$e=ct.viewport,Ne===0&&(e.setRenderTargetTextures(v,ct.colorTexture,d.ignoreDepthValues?void 0:ct.depthStencilTexture),e.setRenderTarget(v))}let D=w[Ne];D===void 0&&(D=new sn,D.layers.enable(Ne),D.viewport=new wt,w[Ne]=D),D.matrix.fromArray(Se.transform.matrix),D.matrix.decompose(D.position,D.quaternion,D.scale),D.projectionMatrix.fromArray(Se.projectionMatrix),D.projectionMatrixInverse.copy(D.projectionMatrix).invert(),D.viewport.set($e.x,$e.y,$e.width,$e.height),Ne===0&&(x.matrix.copy(D.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),fe===!0&&x.cameras.push(D)}const Ce=r.enabledFeatures;if(Ce&&Ce.includes("depth-sensing")){const Ne=f.getDepthInformation(he[0]);Ne&&Ne.isValid&&Ne.texture&&_.init(e,Ne,r.renderState)}}for(let he=0;he<y.length;he++){const fe=S[he],Ce=y[he];fe!==null&&Ce!==void 0&&Ce.update(fe,j,l||o)}U&&U(X,j),j.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:j}),g=null}const se=new Dh;se.setAnimationLoop(K),this.setAnimationLoop=function(X){U=X},this.dispose=function(){}}}const Ni=new Qn,Mx=new mt;function Ex(n,e){function t(h,m){h.matrixAutoUpdate===!0&&h.updateMatrix(),m.value.copy(h.matrix)}function i(h,m){m.color.getRGB(h.fogColor.value,Ch(n)),m.isFog?(h.fogNear.value=m.near,h.fogFar.value=m.far):m.isFogExp2&&(h.fogDensity.value=m.density)}function r(h,m,v,y,S){m.isMeshBasicMaterial||m.isMeshLambertMaterial?s(h,m):m.isMeshToonMaterial?(s(h,m),f(h,m)):m.isMeshPhongMaterial?(s(h,m),u(h,m)):m.isMeshStandardMaterial?(s(h,m),d(h,m),m.isMeshPhysicalMaterial&&p(h,m,S)):m.isMeshMatcapMaterial?(s(h,m),g(h,m)):m.isMeshDepthMaterial?s(h,m):m.isMeshDistanceMaterial?(s(h,m),_(h,m)):m.isMeshNormalMaterial?s(h,m):m.isLineBasicMaterial?(o(h,m),m.isLineDashedMaterial&&a(h,m)):m.isPointsMaterial?c(h,m,v,y):m.isSpriteMaterial?l(h,m):m.isShadowMaterial?(h.color.value.copy(m.color),h.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(h,m){h.opacity.value=m.opacity,m.color&&h.diffuse.value.copy(m.color),m.emissive&&h.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(h.map.value=m.map,t(m.map,h.mapTransform)),m.alphaMap&&(h.alphaMap.value=m.alphaMap,t(m.alphaMap,h.alphaMapTransform)),m.bumpMap&&(h.bumpMap.value=m.bumpMap,t(m.bumpMap,h.bumpMapTransform),h.bumpScale.value=m.bumpScale,m.side===Bt&&(h.bumpScale.value*=-1)),m.normalMap&&(h.normalMap.value=m.normalMap,t(m.normalMap,h.normalMapTransform),h.normalScale.value.copy(m.normalScale),m.side===Bt&&h.normalScale.value.negate()),m.displacementMap&&(h.displacementMap.value=m.displacementMap,t(m.displacementMap,h.displacementMapTransform),h.displacementScale.value=m.displacementScale,h.displacementBias.value=m.displacementBias),m.emissiveMap&&(h.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,h.emissiveMapTransform)),m.specularMap&&(h.specularMap.value=m.specularMap,t(m.specularMap,h.specularMapTransform)),m.alphaTest>0&&(h.alphaTest.value=m.alphaTest);const v=e.get(m),y=v.envMap,S=v.envMapRotation;y&&(h.envMap.value=y,Ni.copy(S),Ni.x*=-1,Ni.y*=-1,Ni.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Ni.y*=-1,Ni.z*=-1),h.envMapRotation.value.setFromMatrix4(Mx.makeRotationFromEuler(Ni)),h.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.reflectivity.value=m.reflectivity,h.ior.value=m.ior,h.refractionRatio.value=m.refractionRatio),m.lightMap&&(h.lightMap.value=m.lightMap,h.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,h.lightMapTransform)),m.aoMap&&(h.aoMap.value=m.aoMap,h.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,h.aoMapTransform))}function o(h,m){h.diffuse.value.copy(m.color),h.opacity.value=m.opacity,m.map&&(h.map.value=m.map,t(m.map,h.mapTransform))}function a(h,m){h.dashSize.value=m.dashSize,h.totalSize.value=m.dashSize+m.gapSize,h.scale.value=m.scale}function c(h,m,v,y){h.diffuse.value.copy(m.color),h.opacity.value=m.opacity,h.size.value=m.size*v,h.scale.value=y*.5,m.map&&(h.map.value=m.map,t(m.map,h.uvTransform)),m.alphaMap&&(h.alphaMap.value=m.alphaMap,t(m.alphaMap,h.alphaMapTransform)),m.alphaTest>0&&(h.alphaTest.value=m.alphaTest)}function l(h,m){h.diffuse.value.copy(m.color),h.opacity.value=m.opacity,h.rotation.value=m.rotation,m.map&&(h.map.value=m.map,t(m.map,h.mapTransform)),m.alphaMap&&(h.alphaMap.value=m.alphaMap,t(m.alphaMap,h.alphaMapTransform)),m.alphaTest>0&&(h.alphaTest.value=m.alphaTest)}function u(h,m){h.specular.value.copy(m.specular),h.shininess.value=Math.max(m.shininess,1e-4)}function f(h,m){m.gradientMap&&(h.gradientMap.value=m.gradientMap)}function d(h,m){h.metalness.value=m.metalness,m.metalnessMap&&(h.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,h.metalnessMapTransform)),h.roughness.value=m.roughness,m.roughnessMap&&(h.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,h.roughnessMapTransform)),m.envMap&&(h.envMapIntensity.value=m.envMapIntensity)}function p(h,m,v){h.ior.value=m.ior,m.sheen>0&&(h.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),h.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(h.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,h.sheenColorMapTransform)),m.sheenRoughnessMap&&(h.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,h.sheenRoughnessMapTransform))),m.clearcoat>0&&(h.clearcoat.value=m.clearcoat,h.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(h.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,h.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(h.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,h.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(h.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,h.clearcoatNormalMapTransform),h.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Bt&&h.clearcoatNormalScale.value.negate())),m.dispersion>0&&(h.dispersion.value=m.dispersion),m.iridescence>0&&(h.iridescence.value=m.iridescence,h.iridescenceIOR.value=m.iridescenceIOR,h.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],h.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(h.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,h.iridescenceMapTransform)),m.iridescenceThicknessMap&&(h.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,h.iridescenceThicknessMapTransform))),m.transmission>0&&(h.transmission.value=m.transmission,h.transmissionSamplerMap.value=v.texture,h.transmissionSamplerSize.value.set(v.width,v.height),m.transmissionMap&&(h.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,h.transmissionMapTransform)),h.thickness.value=m.thickness,m.thicknessMap&&(h.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,h.thicknessMapTransform)),h.attenuationDistance.value=m.attenuationDistance,h.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(h.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(h.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,h.anisotropyMapTransform))),h.specularIntensity.value=m.specularIntensity,h.specularColor.value.copy(m.specularColor),m.specularColorMap&&(h.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,h.specularColorMapTransform)),m.specularIntensityMap&&(h.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,h.specularIntensityMapTransform))}function g(h,m){m.matcap&&(h.matcap.value=m.matcap)}function _(h,m){const v=e.get(m).light;h.referencePosition.value.setFromMatrixPosition(v.matrixWorld),h.nearDistance.value=v.shadow.camera.near,h.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function wx(n,e,t,i){let r={},s={},o=[];const a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(v,y){const S=y.program;i.uniformBlockBinding(v,S)}function l(v,y){let S=r[v.id];S===void 0&&(g(v),S=u(v),r[v.id]=S,v.addEventListener("dispose",h));const b=y.program;i.updateUBOMapping(v,b);const E=e.render.frame;s[v.id]!==E&&(d(v),s[v.id]=E)}function u(v){const y=f();v.__bindingPointIndex=y;const S=n.createBuffer(),b=v.__size,E=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,S),n.bufferData(n.UNIFORM_BUFFER,b,E),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,y,S),S}function f(){for(let v=0;v<a;v++)if(o.indexOf(v)===-1)return o.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(v){const y=r[v.id],S=v.uniforms,b=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,y);for(let E=0,A=S.length;E<A;E++){const C=Array.isArray(S[E])?S[E]:[S[E]];for(let w=0,x=C.length;w<x;w++){const P=C[w];if(p(P,E,w,b)===!0){const V=P.__offset,O=Array.isArray(P.value)?P.value:[P.value];let R=0;for(let I=0;I<O.length;I++){const N=O[I],H=_(N);typeof N=="number"||typeof N=="boolean"?(P.__data[0]=N,n.bufferSubData(n.UNIFORM_BUFFER,V+R,P.__data)):N.isMatrix3?(P.__data[0]=N.elements[0],P.__data[1]=N.elements[1],P.__data[2]=N.elements[2],P.__data[3]=0,P.__data[4]=N.elements[3],P.__data[5]=N.elements[4],P.__data[6]=N.elements[5],P.__data[7]=0,P.__data[8]=N.elements[6],P.__data[9]=N.elements[7],P.__data[10]=N.elements[8],P.__data[11]=0):(N.toArray(P.__data,R),R+=H.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,V,P.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(v,y,S,b){const E=v.value,A=y+"_"+S;if(b[A]===void 0)return typeof E=="number"||typeof E=="boolean"?b[A]=E:b[A]=E.clone(),!0;{const C=b[A];if(typeof E=="number"||typeof E=="boolean"){if(C!==E)return b[A]=E,!0}else if(C.equals(E)===!1)return C.copy(E),!0}return!1}function g(v){const y=v.uniforms;let S=0;const b=16;for(let A=0,C=y.length;A<C;A++){const w=Array.isArray(y[A])?y[A]:[y[A]];for(let x=0,P=w.length;x<P;x++){const V=w[x],O=Array.isArray(V.value)?V.value:[V.value];for(let R=0,I=O.length;R<I;R++){const N=O[R],H=_(N),F=S%b;F!==0&&b-F<H.boundary&&(S+=b-F),V.__data=new Float32Array(H.storage/Float32Array.BYTES_PER_ELEMENT),V.__offset=S,S+=H.storage}}}const E=S%b;return E>0&&(S+=b-E),v.__size=S,v.__cache={},this}function _(v){const y={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(y.boundary=4,y.storage=4):v.isVector2?(y.boundary=8,y.storage=8):v.isVector3||v.isColor?(y.boundary=16,y.storage=12):v.isVector4?(y.boundary=16,y.storage=16):v.isMatrix3?(y.boundary=48,y.storage=48):v.isMatrix4?(y.boundary=64,y.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),y}function h(v){const y=v.target;y.removeEventListener("dispose",h);const S=o.indexOf(y.__bindingPointIndex);o.splice(S,1),n.deleteBuffer(r[y.id]),delete r[y.id],delete s[y.id]}function m(){for(const v in r)n.deleteBuffer(r[v]);o=[],r={},s={}}return{bind:c,update:l,dispose:m}}class bx{constructor(e={}){const{canvas:t=mg(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1}=e;this.isWebGLRenderer=!0;let d;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=i.getContextAttributes().alpha}else d=o;const p=new Uint32Array(4),g=new Int32Array(4);let _=null,h=null;const m=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=In,this.toneMapping=yi,this.toneMappingExposure=1;const y=this;let S=!1,b=0,E=0,A=null,C=-1,w=null;const x=new wt,P=new wt;let V=null;const O=new Ke(0);let R=0,I=t.width,N=t.height,H=1,F=null,ee=null;const ne=new wt(0,0,I,N),U=new wt(0,0,I,N);let K=!1;const se=new Ih;let X=!1,j=!1;const he=new mt,fe=new W,Ce=new wt,Ne={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Se=!1;function $e(){return A===null?H:1}let D=i;function ct(T,z){return t.getContext(T,z)}try{const T={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Jl}`),t.addEventListener("webglcontextlost",Q,!1),t.addEventListener("webglcontextrestored",te,!1),t.addEventListener("webglcontextcreationerror",me,!1),D===null){const z="webgl2";if(D=ct(z,T),D===null)throw ct(z)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(T){throw console.error("THREE.WebGLRenderer: "+T.message),T}let Ye,Ie,Re,dt,Fe,Be,L,M,Y,re,oe,ie,Le,ye,Ee,He,ue,J,ge,_e,ce,ae,Te,Xe;function k(){Ye=new Iv(D),Ye.init(),ae=new mx(D,Ye),Ie=new bv(D,Ye,e,ae),Re=new fx(D),dt=new Nv(D),Fe=new Jy,Be=new px(D,Ye,Re,Fe,Ie,ae,dt),L=new Av(y),M=new Lv(y),Y=new Hg(D),Te=new Ev(D,Y),re=new Dv(D,Y,dt,Te),oe=new kv(D,re,Y,dt),ge=new Fv(D,Ie,Be),He=new Tv(Fe),ie=new Zy(y,L,M,Ye,Ie,Te,He),Le=new Ex(y,Fe),ye=new ex,Ee=new ox(Ye),J=new Mv(y,L,M,Re,oe,d,c),ue=new dx(y,oe,Ie),Xe=new wx(D,dt,Ie,Re),_e=new wv(D,Ye,dt),ce=new Uv(D,Ye,dt),dt.programs=ie.programs,y.capabilities=Ie,y.extensions=Ye,y.properties=Fe,y.renderLists=ye,y.shadowMap=ue,y.state=Re,y.info=dt}k();const de=new Sx(y,D);this.xr=de,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){const T=Ye.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){const T=Ye.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(T){T!==void 0&&(H=T,this.setSize(I,N,!1))},this.getSize=function(T){return T.set(I,N)},this.setSize=function(T,z,q=!0){if(de.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}I=T,N=z,t.width=Math.floor(T*H),t.height=Math.floor(z*H),q===!0&&(t.style.width=T+"px",t.style.height=z+"px"),this.setViewport(0,0,T,z)},this.getDrawingBufferSize=function(T){return T.set(I*H,N*H).floor()},this.setDrawingBufferSize=function(T,z,q){I=T,N=z,H=q,t.width=Math.floor(T*q),t.height=Math.floor(z*q),this.setViewport(0,0,T,z)},this.getCurrentViewport=function(T){return T.copy(x)},this.getViewport=function(T){return T.copy(ne)},this.setViewport=function(T,z,q,$){T.isVector4?ne.set(T.x,T.y,T.z,T.w):ne.set(T,z,q,$),Re.viewport(x.copy(ne).multiplyScalar(H).round())},this.getScissor=function(T){return T.copy(U)},this.setScissor=function(T,z,q,$){T.isVector4?U.set(T.x,T.y,T.z,T.w):U.set(T,z,q,$),Re.scissor(P.copy(U).multiplyScalar(H).round())},this.getScissorTest=function(){return K},this.setScissorTest=function(T){Re.setScissorTest(K=T)},this.setOpaqueSort=function(T){F=T},this.setTransparentSort=function(T){ee=T},this.getClearColor=function(T){return T.copy(J.getClearColor())},this.setClearColor=function(){J.setClearColor.apply(J,arguments)},this.getClearAlpha=function(){return J.getClearAlpha()},this.setClearAlpha=function(){J.setClearAlpha.apply(J,arguments)},this.clear=function(T=!0,z=!0,q=!0){let $=0;if(T){let G=!1;if(A!==null){const pe=A.texture.format;G=pe===ru||pe===iu||pe===nu}if(G){const pe=A.texture.type,Me=pe===Jn||pe===er||pe===Fs||pe===Wr||pe===eu||pe===tu,we=J.getClearColor(),be=J.getClearAlpha(),ke=we.r,Oe=we.g,Ue=we.b;Me?(p[0]=ke,p[1]=Oe,p[2]=Ue,p[3]=be,D.clearBufferuiv(D.COLOR,0,p)):(g[0]=ke,g[1]=Oe,g[2]=Ue,g[3]=be,D.clearBufferiv(D.COLOR,0,g))}else $|=D.COLOR_BUFFER_BIT}z&&($|=D.DEPTH_BUFFER_BIT),q&&($|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),D.clear($)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",Q,!1),t.removeEventListener("webglcontextrestored",te,!1),t.removeEventListener("webglcontextcreationerror",me,!1),ye.dispose(),Ee.dispose(),Fe.dispose(),L.dispose(),M.dispose(),oe.dispose(),Te.dispose(),Xe.dispose(),ie.dispose(),de.dispose(),de.removeEventListener("sessionstart",Cn),de.removeEventListener("sessionend",Nu),Ci.stop()};function Q(T){T.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),S=!0}function te(){console.log("THREE.WebGLRenderer: Context Restored."),S=!1;const T=dt.autoReset,z=ue.enabled,q=ue.autoUpdate,$=ue.needsUpdate,G=ue.type;k(),dt.autoReset=T,ue.enabled=z,ue.autoUpdate=q,ue.needsUpdate=$,ue.type=G}function me(T){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function De(T){const z=T.target;z.removeEventListener("dispose",De),Ze(z)}function Ze(T){_t(T),Fe.remove(T)}function _t(T){const z=Fe.get(T).programs;z!==void 0&&(z.forEach(function(q){ie.releaseProgram(q)}),T.isShaderMaterial&&ie.releaseShaderCache(T))}this.renderBufferDirect=function(T,z,q,$,G,pe){z===null&&(z=Ne);const Me=G.isMesh&&G.matrixWorld.determinant()<0,we=hm(T,z,q,$,G);Re.setMaterial($,Me);let be=q.index,ke=1;if($.wireframe===!0){if(be=re.getWireframeAttribute(q),be===void 0)return;ke=2}const Oe=q.drawRange,Ue=q.attributes.position;let et=Oe.start*ke,ft=(Oe.start+Oe.count)*ke;pe!==null&&(et=Math.max(et,pe.start*ke),ft=Math.min(ft,(pe.start+pe.count)*ke)),be!==null?(et=Math.max(et,0),ft=Math.min(ft,be.count)):Ue!=null&&(et=Math.max(et,0),ft=Math.min(ft,Ue.count));const ht=ft-et;if(ht<0||ht===1/0)return;Te.setup(G,$,we,q,be);let qt,tt=_e;if(be!==null&&(qt=Y.get(be),tt=ce,tt.setIndex(qt)),G.isMesh)$.wireframe===!0?(Re.setLineWidth($.wireframeLinewidth*$e()),tt.setMode(D.LINES)):tt.setMode(D.TRIANGLES);else if(G.isLine){let Pe=$.linewidth;Pe===void 0&&(Pe=1),Re.setLineWidth(Pe*$e()),G.isLineSegments?tt.setMode(D.LINES):G.isLineLoop?tt.setMode(D.LINE_LOOP):tt.setMode(D.LINE_STRIP)}else G.isPoints?tt.setMode(D.POINTS):G.isSprite&&tt.setMode(D.TRIANGLES);if(G.isBatchedMesh)if(G._multiDrawInstances!==null)tt.renderMultiDrawInstances(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount,G._multiDrawInstances);else if(Ye.get("WEBGL_multi_draw"))tt.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{const Pe=G._multiDrawStarts,At=G._multiDrawCounts,nt=G._multiDrawCount,mn=be?Y.get(be).bytesPerElement:1,cr=Fe.get($).currentProgram.getUniforms();for(let $t=0;$t<nt;$t++)cr.setValue(D,"_gl_DrawID",$t),tt.render(Pe[$t]/mn,At[$t])}else if(G.isInstancedMesh)tt.renderInstances(et,ht,G.count);else if(q.isInstancedBufferGeometry){const Pe=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,At=Math.min(q.instanceCount,Pe);tt.renderInstances(et,ht,At)}else tt.render(et,ht)};function Tt(T,z,q){T.transparent===!0&&T.side===En&&T.forceSinglePass===!1?(T.side=Bt,T.needsUpdate=!0,uo(T,z,q),T.side=Ei,T.needsUpdate=!0,uo(T,z,q),T.side=En):uo(T,z,q)}this.compile=function(T,z,q=null){q===null&&(q=T),h=Ee.get(q),h.init(z),v.push(h),q.traverseVisible(function(G){G.isLight&&G.layers.test(z.layers)&&(h.pushLight(G),G.castShadow&&h.pushShadow(G))}),T!==q&&T.traverseVisible(function(G){G.isLight&&G.layers.test(z.layers)&&(h.pushLight(G),G.castShadow&&h.pushShadow(G))}),h.setupLights();const $=new Set;return T.traverse(function(G){const pe=G.material;if(pe)if(Array.isArray(pe))for(let Me=0;Me<pe.length;Me++){const we=pe[Me];Tt(we,q,G),$.add(we)}else Tt(pe,q,G),$.add(pe)}),v.pop(),h=null,$},this.compileAsync=function(T,z,q=null){const $=this.compile(T,z,q);return new Promise(G=>{function pe(){if($.forEach(function(Me){Fe.get(Me).currentProgram.isReady()&&$.delete(Me)}),$.size===0){G(T);return}setTimeout(pe,10)}Ye.get("KHR_parallel_shader_compile")!==null?pe():setTimeout(pe,10)})};let Qe=null;function Nn(T){Qe&&Qe(T)}function Cn(){Ci.stop()}function Nu(){Ci.start()}const Ci=new Dh;Ci.setAnimationLoop(Nn),typeof self<"u"&&Ci.setContext(self),this.setAnimationLoop=function(T){Qe=T,de.setAnimationLoop(T),T===null?Ci.stop():Ci.start()},de.addEventListener("sessionstart",Cn),de.addEventListener("sessionend",Nu),this.render=function(T,z){if(z!==void 0&&z.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(S===!0)return;if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),z.parent===null&&z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),de.enabled===!0&&de.isPresenting===!0&&(de.cameraAutoUpdate===!0&&de.updateCamera(z),z=de.getCamera()),T.isScene===!0&&T.onBeforeRender(y,T,z,A),h=Ee.get(T,v.length),h.init(z),v.push(h),he.multiplyMatrices(z.projectionMatrix,z.matrixWorldInverse),se.setFromProjectionMatrix(he),j=this.localClippingEnabled,X=He.init(this.clippingPlanes,j),_=ye.get(T,m.length),_.init(),m.push(_),de.enabled===!0&&de.isPresenting===!0){const pe=y.xr.getDepthSensingMesh();pe!==null&&ja(pe,z,-1/0,y.sortObjects)}ja(T,z,0,y.sortObjects),_.finish(),y.sortObjects===!0&&_.sort(F,ee),Se=de.enabled===!1||de.isPresenting===!1||de.hasDepthSensing()===!1,Se&&J.addToRenderList(_,T),this.info.render.frame++,X===!0&&He.beginShadows();const q=h.state.shadowsArray;ue.render(q,T,z),X===!0&&He.endShadows(),this.info.autoReset===!0&&this.info.reset();const $=_.opaque,G=_.transmissive;if(h.setupLights(),z.isArrayCamera){const pe=z.cameras;if(G.length>0)for(let Me=0,we=pe.length;Me<we;Me++){const be=pe[Me];ku($,G,T,be)}Se&&J.render(T);for(let Me=0,we=pe.length;Me<we;Me++){const be=pe[Me];Fu(_,T,be,be.viewport)}}else G.length>0&&ku($,G,T,z),Se&&J.render(T),Fu(_,T,z);A!==null&&(Be.updateMultisampleRenderTarget(A),Be.updateRenderTargetMipmap(A)),T.isScene===!0&&T.onAfterRender(y,T,z),Te.resetDefaultState(),C=-1,w=null,v.pop(),v.length>0?(h=v[v.length-1],X===!0&&He.setGlobalState(y.clippingPlanes,h.state.camera)):h=null,m.pop(),m.length>0?_=m[m.length-1]:_=null};function ja(T,z,q,$){if(T.visible===!1)return;if(T.layers.test(z.layers)){if(T.isGroup)q=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(z);else if(T.isLight)h.pushLight(T),T.castShadow&&h.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||se.intersectsSprite(T)){$&&Ce.setFromMatrixPosition(T.matrixWorld).applyMatrix4(he);const Me=oe.update(T),we=T.material;we.visible&&_.push(T,Me,we,q,Ce.z,null)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||se.intersectsObject(T))){const Me=oe.update(T),we=T.material;if($&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),Ce.copy(T.boundingSphere.center)):(Me.boundingSphere===null&&Me.computeBoundingSphere(),Ce.copy(Me.boundingSphere.center)),Ce.applyMatrix4(T.matrixWorld).applyMatrix4(he)),Array.isArray(we)){const be=Me.groups;for(let ke=0,Oe=be.length;ke<Oe;ke++){const Ue=be[ke],et=we[Ue.materialIndex];et&&et.visible&&_.push(T,Me,et,q,Ce.z,Ue)}}else we.visible&&_.push(T,Me,we,q,Ce.z,null)}}const pe=T.children;for(let Me=0,we=pe.length;Me<we;Me++)ja(pe[Me],z,q,$)}function Fu(T,z,q,$){const G=T.opaque,pe=T.transmissive,Me=T.transparent;h.setupLightsView(q),X===!0&&He.setGlobalState(y.clippingPlanes,q),$&&Re.viewport(x.copy($)),G.length>0&&lo(G,z,q),pe.length>0&&lo(pe,z,q),Me.length>0&&lo(Me,z,q),Re.buffers.depth.setTest(!0),Re.buffers.depth.setMask(!0),Re.buffers.color.setMask(!0),Re.setPolygonOffset(!1)}function ku(T,z,q,$){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;h.state.transmissionRenderTarget[$.id]===void 0&&(h.state.transmissionRenderTarget[$.id]=new tr(1,1,{generateMipmaps:!0,type:Ye.has("EXT_color_buffer_half_float")||Ye.has("EXT_color_buffer_float")?$s:Jn,minFilter:qi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:st.workingColorSpace}));const pe=h.state.transmissionRenderTarget[$.id],Me=$.viewport||x;pe.setSize(Me.z,Me.w);const we=y.getRenderTarget();y.setRenderTarget(pe),y.getClearColor(O),R=y.getClearAlpha(),R<1&&y.setClearColor(16777215,.5),Se?J.render(q):y.clear();const be=y.toneMapping;y.toneMapping=yi;const ke=$.viewport;if($.viewport!==void 0&&($.viewport=void 0),h.setupLightsView($),X===!0&&He.setGlobalState(y.clippingPlanes,$),lo(T,q,$),Be.updateMultisampleRenderTarget(pe),Be.updateRenderTargetMipmap(pe),Ye.has("WEBGL_multisampled_render_to_texture")===!1){let Oe=!1;for(let Ue=0,et=z.length;Ue<et;Ue++){const ft=z[Ue],ht=ft.object,qt=ft.geometry,tt=ft.material,Pe=ft.group;if(tt.side===En&&ht.layers.test($.layers)){const At=tt.side;tt.side=Bt,tt.needsUpdate=!0,Ou(ht,q,$,qt,tt,Pe),tt.side=At,tt.needsUpdate=!0,Oe=!0}}Oe===!0&&(Be.updateMultisampleRenderTarget(pe),Be.updateRenderTargetMipmap(pe))}y.setRenderTarget(we),y.setClearColor(O,R),ke!==void 0&&($.viewport=ke),y.toneMapping=be}function lo(T,z,q){const $=z.isScene===!0?z.overrideMaterial:null;for(let G=0,pe=T.length;G<pe;G++){const Me=T[G],we=Me.object,be=Me.geometry,ke=$===null?Me.material:$,Oe=Me.group;we.layers.test(q.layers)&&Ou(we,z,q,be,ke,Oe)}}function Ou(T,z,q,$,G,pe){T.onBeforeRender(y,z,q,$,G,pe),T.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),G.transparent===!0&&G.side===En&&G.forceSinglePass===!1?(G.side=Bt,G.needsUpdate=!0,y.renderBufferDirect(q,z,$,G,T,pe),G.side=Ei,G.needsUpdate=!0,y.renderBufferDirect(q,z,$,G,T,pe),G.side=En):y.renderBufferDirect(q,z,$,G,T,pe),T.onAfterRender(y,z,q,$,G,pe)}function uo(T,z,q){z.isScene!==!0&&(z=Ne);const $=Fe.get(T),G=h.state.lights,pe=h.state.shadowsArray,Me=G.state.version,we=ie.getParameters(T,G.state,pe,z,q),be=ie.getProgramCacheKey(we);let ke=$.programs;$.environment=T.isMeshStandardMaterial?z.environment:null,$.fog=z.fog,$.envMap=(T.isMeshStandardMaterial?M:L).get(T.envMap||$.environment),$.envMapRotation=$.environment!==null&&T.envMap===null?z.environmentRotation:T.envMapRotation,ke===void 0&&(T.addEventListener("dispose",De),ke=new Map,$.programs=ke);let Oe=ke.get(be);if(Oe!==void 0){if($.currentProgram===Oe&&$.lightsStateVersion===Me)return zu(T,we),Oe}else we.uniforms=ie.getUniforms(T),T.onBeforeCompile(we,y),Oe=ie.acquireProgram(we,be),ke.set(be,Oe),$.uniforms=we.uniforms;const Ue=$.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(Ue.clippingPlanes=He.uniform),zu(T,we),$.needsLights=mm(T),$.lightsStateVersion=Me,$.needsLights&&(Ue.ambientLightColor.value=G.state.ambient,Ue.lightProbe.value=G.state.probe,Ue.directionalLights.value=G.state.directional,Ue.directionalLightShadows.value=G.state.directionalShadow,Ue.spotLights.value=G.state.spot,Ue.spotLightShadows.value=G.state.spotShadow,Ue.rectAreaLights.value=G.state.rectArea,Ue.ltc_1.value=G.state.rectAreaLTC1,Ue.ltc_2.value=G.state.rectAreaLTC2,Ue.pointLights.value=G.state.point,Ue.pointLightShadows.value=G.state.pointShadow,Ue.hemisphereLights.value=G.state.hemi,Ue.directionalShadowMap.value=G.state.directionalShadowMap,Ue.directionalShadowMatrix.value=G.state.directionalShadowMatrix,Ue.spotShadowMap.value=G.state.spotShadowMap,Ue.spotLightMatrix.value=G.state.spotLightMatrix,Ue.spotLightMap.value=G.state.spotLightMap,Ue.pointShadowMap.value=G.state.pointShadowMap,Ue.pointShadowMatrix.value=G.state.pointShadowMatrix),$.currentProgram=Oe,$.uniformsList=null,Oe}function Bu(T){if(T.uniformsList===null){const z=T.currentProgram.getUniforms();T.uniformsList=oa.seqWithValue(z.seq,T.uniforms)}return T.uniformsList}function zu(T,z){const q=Fe.get(T);q.outputColorSpace=z.outputColorSpace,q.batching=z.batching,q.batchingColor=z.batchingColor,q.instancing=z.instancing,q.instancingColor=z.instancingColor,q.instancingMorph=z.instancingMorph,q.skinning=z.skinning,q.morphTargets=z.morphTargets,q.morphNormals=z.morphNormals,q.morphColors=z.morphColors,q.morphTargetsCount=z.morphTargetsCount,q.numClippingPlanes=z.numClippingPlanes,q.numIntersection=z.numClipIntersection,q.vertexAlphas=z.vertexAlphas,q.vertexTangents=z.vertexTangents,q.toneMapping=z.toneMapping}function hm(T,z,q,$,G){z.isScene!==!0&&(z=Ne),Be.resetTextureUnits();const pe=z.fog,Me=$.isMeshStandardMaterial?z.environment:null,we=A===null?y.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Ti,be=($.isMeshStandardMaterial?M:L).get($.envMap||Me),ke=$.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,Oe=!!q.attributes.tangent&&(!!$.normalMap||$.anisotropy>0),Ue=!!q.morphAttributes.position,et=!!q.morphAttributes.normal,ft=!!q.morphAttributes.color;let ht=yi;$.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(ht=y.toneMapping);const qt=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,tt=qt!==void 0?qt.length:0,Pe=Fe.get($),At=h.state.lights;if(X===!0&&(j===!0||T!==w)){const nn=T===w&&$.id===C;He.setState($,T,nn)}let nt=!1;$.version===Pe.__version?(Pe.needsLights&&Pe.lightsStateVersion!==At.state.version||Pe.outputColorSpace!==we||G.isBatchedMesh&&Pe.batching===!1||!G.isBatchedMesh&&Pe.batching===!0||G.isBatchedMesh&&Pe.batchingColor===!0&&G.colorTexture===null||G.isBatchedMesh&&Pe.batchingColor===!1&&G.colorTexture!==null||G.isInstancedMesh&&Pe.instancing===!1||!G.isInstancedMesh&&Pe.instancing===!0||G.isSkinnedMesh&&Pe.skinning===!1||!G.isSkinnedMesh&&Pe.skinning===!0||G.isInstancedMesh&&Pe.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&Pe.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&Pe.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&Pe.instancingMorph===!1&&G.morphTexture!==null||Pe.envMap!==be||$.fog===!0&&Pe.fog!==pe||Pe.numClippingPlanes!==void 0&&(Pe.numClippingPlanes!==He.numPlanes||Pe.numIntersection!==He.numIntersection)||Pe.vertexAlphas!==ke||Pe.vertexTangents!==Oe||Pe.morphTargets!==Ue||Pe.morphNormals!==et||Pe.morphColors!==ft||Pe.toneMapping!==ht||Pe.morphTargetsCount!==tt)&&(nt=!0):(nt=!0,Pe.__version=$.version);let mn=Pe.currentProgram;nt===!0&&(mn=uo($,z,G));let cr=!1,$t=!1,Za=!1;const vt=mn.getUniforms(),ni=Pe.uniforms;if(Re.useProgram(mn.program)&&(cr=!0,$t=!0,Za=!0),$.id!==C&&(C=$.id,$t=!0),cr||w!==T){vt.setValue(D,"projectionMatrix",T.projectionMatrix),vt.setValue(D,"viewMatrix",T.matrixWorldInverse);const nn=vt.map.cameraPosition;nn!==void 0&&nn.setValue(D,fe.setFromMatrixPosition(T.matrixWorld)),Ie.logarithmicDepthBuffer&&vt.setValue(D,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),($.isMeshPhongMaterial||$.isMeshToonMaterial||$.isMeshLambertMaterial||$.isMeshBasicMaterial||$.isMeshStandardMaterial||$.isShaderMaterial)&&vt.setValue(D,"isOrthographic",T.isOrthographicCamera===!0),w!==T&&(w=T,$t=!0,Za=!0)}if(G.isSkinnedMesh){vt.setOptional(D,G,"bindMatrix"),vt.setOptional(D,G,"bindMatrixInverse");const nn=G.skeleton;nn&&(nn.boneTexture===null&&nn.computeBoneTexture(),vt.setValue(D,"boneTexture",nn.boneTexture,Be))}G.isBatchedMesh&&(vt.setOptional(D,G,"batchingTexture"),vt.setValue(D,"batchingTexture",G._matricesTexture,Be),vt.setOptional(D,G,"batchingIdTexture"),vt.setValue(D,"batchingIdTexture",G._indirectTexture,Be),vt.setOptional(D,G,"batchingColorTexture"),G._colorsTexture!==null&&vt.setValue(D,"batchingColorTexture",G._colorsTexture,Be));const Ja=q.morphAttributes;if((Ja.position!==void 0||Ja.normal!==void 0||Ja.color!==void 0)&&ge.update(G,q,mn),($t||Pe.receiveShadow!==G.receiveShadow)&&(Pe.receiveShadow=G.receiveShadow,vt.setValue(D,"receiveShadow",G.receiveShadow)),$.isMeshGouraudMaterial&&$.envMap!==null&&(ni.envMap.value=be,ni.flipEnvMap.value=be.isCubeTexture&&be.isRenderTargetTexture===!1?-1:1),$.isMeshStandardMaterial&&$.envMap===null&&z.environment!==null&&(ni.envMapIntensity.value=z.environmentIntensity),$t&&(vt.setValue(D,"toneMappingExposure",y.toneMappingExposure),Pe.needsLights&&pm(ni,Za),pe&&$.fog===!0&&Le.refreshFogUniforms(ni,pe),Le.refreshMaterialUniforms(ni,$,H,N,h.state.transmissionRenderTarget[T.id]),oa.upload(D,Bu(Pe),ni,Be)),$.isShaderMaterial&&$.uniformsNeedUpdate===!0&&(oa.upload(D,Bu(Pe),ni,Be),$.uniformsNeedUpdate=!1),$.isSpriteMaterial&&vt.setValue(D,"center",G.center),vt.setValue(D,"modelViewMatrix",G.modelViewMatrix),vt.setValue(D,"normalMatrix",G.normalMatrix),vt.setValue(D,"modelMatrix",G.matrixWorld),$.isShaderMaterial||$.isRawShaderMaterial){const nn=$.uniformsGroups;for(let Qa=0,gm=nn.length;Qa<gm;Qa++){const Hu=nn[Qa];Xe.update(Hu,mn),Xe.bind(Hu,mn)}}return mn}function pm(T,z){T.ambientLightColor.needsUpdate=z,T.lightProbe.needsUpdate=z,T.directionalLights.needsUpdate=z,T.directionalLightShadows.needsUpdate=z,T.pointLights.needsUpdate=z,T.pointLightShadows.needsUpdate=z,T.spotLights.needsUpdate=z,T.spotLightShadows.needsUpdate=z,T.rectAreaLights.needsUpdate=z,T.hemisphereLights.needsUpdate=z}function mm(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return b},this.getActiveMipmapLevel=function(){return E},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(T,z,q){Fe.get(T.texture).__webglTexture=z,Fe.get(T.depthTexture).__webglTexture=q;const $=Fe.get(T);$.__hasExternalTextures=!0,$.__autoAllocateDepthBuffer=q===void 0,$.__autoAllocateDepthBuffer||Ye.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),$.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(T,z){const q=Fe.get(T);q.__webglFramebuffer=z,q.__useDefaultFramebuffer=z===void 0},this.setRenderTarget=function(T,z=0,q=0){A=T,b=z,E=q;let $=!0,G=null,pe=!1,Me=!1;if(T){const be=Fe.get(T);be.__useDefaultFramebuffer!==void 0?(Re.bindFramebuffer(D.FRAMEBUFFER,null),$=!1):be.__webglFramebuffer===void 0?Be.setupRenderTarget(T):be.__hasExternalTextures&&Be.rebindTextures(T,Fe.get(T.texture).__webglTexture,Fe.get(T.depthTexture).__webglTexture);const ke=T.texture;(ke.isData3DTexture||ke.isDataArrayTexture||ke.isCompressedArrayTexture)&&(Me=!0);const Oe=Fe.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(Oe[z])?G=Oe[z][q]:G=Oe[z],pe=!0):T.samples>0&&Be.useMultisampledRTT(T)===!1?G=Fe.get(T).__webglMultisampledFramebuffer:Array.isArray(Oe)?G=Oe[q]:G=Oe,x.copy(T.viewport),P.copy(T.scissor),V=T.scissorTest}else x.copy(ne).multiplyScalar(H).floor(),P.copy(U).multiplyScalar(H).floor(),V=K;if(Re.bindFramebuffer(D.FRAMEBUFFER,G)&&$&&Re.drawBuffers(T,G),Re.viewport(x),Re.scissor(P),Re.setScissorTest(V),pe){const be=Fe.get(T.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+z,be.__webglTexture,q)}else if(Me){const be=Fe.get(T.texture),ke=z||0;D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,be.__webglTexture,q||0,ke)}C=-1},this.readRenderTargetPixels=function(T,z,q,$,G,pe,Me){if(!(T&&T.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let we=Fe.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&Me!==void 0&&(we=we[Me]),we){Re.bindFramebuffer(D.FRAMEBUFFER,we);try{const be=T.texture,ke=be.format,Oe=be.type;if(!Ie.textureFormatReadable(ke)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ie.textureTypeReadable(Oe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}z>=0&&z<=T.width-$&&q>=0&&q<=T.height-G&&D.readPixels(z,q,$,G,ae.convert(ke),ae.convert(Oe),pe)}finally{const be=A!==null?Fe.get(A).__webglFramebuffer:null;Re.bindFramebuffer(D.FRAMEBUFFER,be)}}},this.readRenderTargetPixelsAsync=async function(T,z,q,$,G,pe,Me){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let we=Fe.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&Me!==void 0&&(we=we[Me]),we){Re.bindFramebuffer(D.FRAMEBUFFER,we);try{const be=T.texture,ke=be.format,Oe=be.type;if(!Ie.textureFormatReadable(ke))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ie.textureTypeReadable(Oe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(z>=0&&z<=T.width-$&&q>=0&&q<=T.height-G){const Ue=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Ue),D.bufferData(D.PIXEL_PACK_BUFFER,pe.byteLength,D.STREAM_READ),D.readPixels(z,q,$,G,ae.convert(ke),ae.convert(Oe),0),D.flush();const et=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);await gg(D,et,4);try{D.bindBuffer(D.PIXEL_PACK_BUFFER,Ue),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,pe)}finally{D.deleteBuffer(Ue),D.deleteSync(et)}return pe}}finally{const be=A!==null?Fe.get(A).__webglFramebuffer:null;Re.bindFramebuffer(D.FRAMEBUFFER,be)}}},this.copyFramebufferToTexture=function(T,z=null,q=0){T.isTexture!==!0&&(console.warn("WebGLRenderer: copyFramebufferToTexture function signature has changed."),z=arguments[0]||null,T=arguments[1]);const $=Math.pow(2,-q),G=Math.floor(T.image.width*$),pe=Math.floor(T.image.height*$),Me=z!==null?z.x:0,we=z!==null?z.y:0;Be.setTexture2D(T,0),D.copyTexSubImage2D(D.TEXTURE_2D,q,0,0,Me,we,G,pe),Re.unbindTexture()},this.copyTextureToTexture=function(T,z,q=null,$=null,G=0){T.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture function signature has changed."),$=arguments[0]||null,T=arguments[1],z=arguments[2],G=arguments[3]||0,q=null);let pe,Me,we,be,ke,Oe;q!==null?(pe=q.max.x-q.min.x,Me=q.max.y-q.min.y,we=q.min.x,be=q.min.y):(pe=T.image.width,Me=T.image.height,we=0,be=0),$!==null?(ke=$.x,Oe=$.y):(ke=0,Oe=0);const Ue=ae.convert(z.format),et=ae.convert(z.type);Be.setTexture2D(z,0),D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,z.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,z.unpackAlignment);const ft=D.getParameter(D.UNPACK_ROW_LENGTH),ht=D.getParameter(D.UNPACK_IMAGE_HEIGHT),qt=D.getParameter(D.UNPACK_SKIP_PIXELS),tt=D.getParameter(D.UNPACK_SKIP_ROWS),Pe=D.getParameter(D.UNPACK_SKIP_IMAGES),At=T.isCompressedTexture?T.mipmaps[G]:T.image;D.pixelStorei(D.UNPACK_ROW_LENGTH,At.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,At.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,we),D.pixelStorei(D.UNPACK_SKIP_ROWS,be),T.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,G,ke,Oe,pe,Me,Ue,et,At.data):T.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,G,ke,Oe,At.width,At.height,Ue,At.data):D.texSubImage2D(D.TEXTURE_2D,G,ke,Oe,pe,Me,Ue,et,At),D.pixelStorei(D.UNPACK_ROW_LENGTH,ft),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,ht),D.pixelStorei(D.UNPACK_SKIP_PIXELS,qt),D.pixelStorei(D.UNPACK_SKIP_ROWS,tt),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Pe),G===0&&z.generateMipmaps&&D.generateMipmap(D.TEXTURE_2D),Re.unbindTexture()},this.copyTextureToTexture3D=function(T,z,q=null,$=null,G=0){T.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture3D function signature has changed."),q=arguments[0]||null,$=arguments[1]||null,T=arguments[2],z=arguments[3],G=arguments[4]||0);let pe,Me,we,be,ke,Oe,Ue,et,ft;const ht=T.isCompressedTexture?T.mipmaps[G]:T.image;q!==null?(pe=q.max.x-q.min.x,Me=q.max.y-q.min.y,we=q.max.z-q.min.z,be=q.min.x,ke=q.min.y,Oe=q.min.z):(pe=ht.width,Me=ht.height,we=ht.depth,be=0,ke=0,Oe=0),$!==null?(Ue=$.x,et=$.y,ft=$.z):(Ue=0,et=0,ft=0);const qt=ae.convert(z.format),tt=ae.convert(z.type);let Pe;if(z.isData3DTexture)Be.setTexture3D(z,0),Pe=D.TEXTURE_3D;else if(z.isDataArrayTexture||z.isCompressedArrayTexture)Be.setTexture2DArray(z,0),Pe=D.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,z.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,z.unpackAlignment);const At=D.getParameter(D.UNPACK_ROW_LENGTH),nt=D.getParameter(D.UNPACK_IMAGE_HEIGHT),mn=D.getParameter(D.UNPACK_SKIP_PIXELS),cr=D.getParameter(D.UNPACK_SKIP_ROWS),$t=D.getParameter(D.UNPACK_SKIP_IMAGES);D.pixelStorei(D.UNPACK_ROW_LENGTH,ht.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,ht.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,be),D.pixelStorei(D.UNPACK_SKIP_ROWS,ke),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Oe),T.isDataTexture||T.isData3DTexture?D.texSubImage3D(Pe,G,Ue,et,ft,pe,Me,we,qt,tt,ht.data):z.isCompressedArrayTexture?D.compressedTexSubImage3D(Pe,G,Ue,et,ft,pe,Me,we,qt,ht.data):D.texSubImage3D(Pe,G,Ue,et,ft,pe,Me,we,qt,tt,ht),D.pixelStorei(D.UNPACK_ROW_LENGTH,At),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,nt),D.pixelStorei(D.UNPACK_SKIP_PIXELS,mn),D.pixelStorei(D.UNPACK_SKIP_ROWS,cr),D.pixelStorei(D.UNPACK_SKIP_IMAGES,$t),G===0&&z.generateMipmaps&&D.generateMipmap(Pe),Re.unbindTexture()},this.initRenderTarget=function(T){Fe.get(T).__webglFramebuffer===void 0&&Be.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?Be.setTextureCube(T,0):T.isData3DTexture?Be.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?Be.setTexture2DArray(T,0):Be.setTexture2D(T,0),Re.unbindTexture()},this.resetState=function(){b=0,E=0,A=null,Re.reset(),Te.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Yn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===su?"display-p3":"srgb",t.unpackColorSpace=st.workingColorSpace===Oa?"display-p3":"srgb"}}class za{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ke(e),this.density=t}clone(){return new za(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Tx extends Dt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Qn,this.environmentIntensity=1,this.environmentRotation=new Qn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class Ax{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Cl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=xi()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return ou("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=xi()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=xi()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Ut=new W;class xa{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)Ut.fromBufferAttribute(this,t),Ut.applyMatrix4(e),this.setXYZ(t,Ut.x,Ut.y,Ut.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Ut.fromBufferAttribute(this,t),Ut.applyNormalMatrix(e),this.setXYZ(t,Ut.x,Ut.y,Ut.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Ut.fromBufferAttribute(this,t),Ut.transformDirection(e),this.setXYZ(t,Ut.x,Ut.y,Ut.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=Un(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=at(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=at(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=at(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=at(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=at(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Un(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Un(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Un(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Un(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=at(t,this.array),i=at(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=at(t,this.array),i=at(i,this.array),r=at(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=at(t,this.array),i=at(i,this.array),r=at(r,this.array),s=at(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new bt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new xa(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class Sa extends rr{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ke(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}let Tr;const as=new W,Ar=new W,Rr=new W,Cr=new qe,cs=new qe,Bh=new mt,Uo=new W,ls=new W,No=new W,kd=new qe,Ac=new qe,Od=new qe;class Il extends Dt{constructor(e=new Sa){if(super(),this.isSprite=!0,this.type="Sprite",Tr===void 0){Tr=new Xt;const t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new Ax(t,5);Tr.setIndex([0,1,2,0,2,3]),Tr.setAttribute("position",new xa(i,3,0,!1)),Tr.setAttribute("uv",new xa(i,2,3,!1))}this.geometry=Tr,this.material=e,this.center=new qe(.5,.5)}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Ar.setFromMatrixScale(this.matrixWorld),Bh.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Rr.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Ar.multiplyScalar(-Rr.z);const i=this.material.rotation;let r,s;i!==0&&(s=Math.cos(i),r=Math.sin(i));const o=this.center;Fo(Uo.set(-.5,-.5,0),Rr,o,Ar,r,s),Fo(ls.set(.5,-.5,0),Rr,o,Ar,r,s),Fo(No.set(.5,.5,0),Rr,o,Ar,r,s),kd.set(0,0),Ac.set(1,0),Od.set(1,1);let a=e.ray.intersectTriangle(Uo,ls,No,!1,as);if(a===null&&(Fo(ls.set(-.5,.5,0),Rr,o,Ar,r,s),Ac.set(0,1),a=e.ray.intersectTriangle(Uo,No,ls,!1,as),a===null))return;const c=e.ray.origin.distanceTo(as);c<e.near||c>e.far||t.push({distance:c,point:as.clone(),uv:on.getInterpolation(as,Uo,ls,No,kd,Ac,Od,new qe),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}}function Fo(n,e,t,i,r,s){Cr.subVectors(n,t).addScalar(.5).multiply(i),r!==void 0?(cs.x=s*Cr.x-r*Cr.y,cs.y=r*Cr.x+s*Cr.y):cs.copy(Cr),n.copy(e),n.x+=cs.x,n.y+=cs.y,n.applyMatrix4(Bh)}class zh extends rr{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ke(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Ma=new W,Ea=new W,Bd=new mt,us=new au,ko=new js,Rc=new W,zd=new W;class Rx extends Dt{constructor(e=new Xt,t=new zh){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)Ma.fromBufferAttribute(t,r-1),Ea.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Ma.distanceTo(Ea);e.setAttribute("lineDistance",new Jt(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ko.copy(i.boundingSphere),ko.applyMatrix4(r),ko.radius+=s,e.ray.intersectsSphere(ko)===!1)return;Bd.copy(r).invert(),us.copy(e.ray).applyMatrix4(Bd);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,u=i.index,d=i.attributes.position;if(u!==null){const p=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let _=p,h=g-1;_<h;_+=l){const m=u.getX(_),v=u.getX(_+1),y=Oo(this,e,us,c,m,v);y&&t.push(y)}if(this.isLineLoop){const _=u.getX(g-1),h=u.getX(p),m=Oo(this,e,us,c,_,h);m&&t.push(m)}}else{const p=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let _=p,h=g-1;_<h;_+=l){const m=Oo(this,e,us,c,_,_+1);m&&t.push(m)}if(this.isLineLoop){const _=Oo(this,e,us,c,g-1,p);_&&t.push(_)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function Oo(n,e,t,i,r,s){const o=n.geometry.attributes.position;if(Ma.fromBufferAttribute(o,r),Ea.fromBufferAttribute(o,s),t.distanceSqToSegment(Ma,Ea,Rc,zd)>i)return;Rc.applyMatrix4(n.matrixWorld);const c=e.ray.origin.distanceTo(Rc);if(!(c<e.near||c>e.far))return{distance:c,point:zd.clone().applyMatrix4(n.matrixWorld),index:r,face:null,faceIndex:null,object:n}}const Hd=new W,Gd=new W;class Cx extends Rx{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)Hd.fromBufferAttribute(t,r),Gd.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+Hd.distanceTo(Gd);e.setAttribute("lineDistance",new Jt(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Hh extends rr{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ke(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const Vd=new mt,Dl=new au,Bo=new js,zo=new W;class Px extends Dt{constructor(e=new Xt,t=new Hh){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Bo.copy(i.boundingSphere),Bo.applyMatrix4(r),Bo.radius+=s,e.ray.intersectsSphere(Bo)===!1)return;Vd.copy(r).invert(),Dl.copy(e.ray).applyMatrix4(Vd);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=i.index,f=i.attributes.position;if(l!==null){const d=Math.max(0,o.start),p=Math.min(l.count,o.start+o.count);for(let g=d,_=p;g<_;g++){const h=l.getX(g);zo.fromBufferAttribute(f,h),Wd(zo,h,c,r,e,t,this)}}else{const d=Math.max(0,o.start),p=Math.min(f.count,o.start+o.count);for(let g=d,_=p;g<_;g++)zo.fromBufferAttribute(f,g),Wd(zo,g,c,r,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function Wd(n,e,t,i,r,s,o){const a=Dl.distanceSqToPoint(n);if(a<t){const c=new W;Dl.closestPointToPoint(n,c),c.applyMatrix4(i);const l=r.ray.origin.distanceTo(c);if(l<r.near||l>r.far)return;s.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:e,face:null,object:o})}}class $r extends zt{constructor(e,t,i,r,s,o,a,c,l){super(e,t,i,r,s,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}const Ho=new W,Go=new W,Cc=new W,Vo=new on;class Lx extends Xt{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){const r=Math.pow(10,4),s=Math.cos(sa*t),o=e.getIndex(),a=e.getAttribute("position"),c=o?o.count:a.count,l=[0,0,0],u=["a","b","c"],f=new Array(3),d={},p=[];for(let g=0;g<c;g+=3){o?(l[0]=o.getX(g),l[1]=o.getX(g+1),l[2]=o.getX(g+2)):(l[0]=g,l[1]=g+1,l[2]=g+2);const{a:_,b:h,c:m}=Vo;if(_.fromBufferAttribute(a,l[0]),h.fromBufferAttribute(a,l[1]),m.fromBufferAttribute(a,l[2]),Vo.getNormal(Cc),f[0]=`${Math.round(_.x*r)},${Math.round(_.y*r)},${Math.round(_.z*r)}`,f[1]=`${Math.round(h.x*r)},${Math.round(h.y*r)},${Math.round(h.z*r)}`,f[2]=`${Math.round(m.x*r)},${Math.round(m.y*r)},${Math.round(m.z*r)}`,!(f[0]===f[1]||f[1]===f[2]||f[2]===f[0]))for(let v=0;v<3;v++){const y=(v+1)%3,S=f[v],b=f[y],E=Vo[u[v]],A=Vo[u[y]],C=`${S}_${b}`,w=`${b}_${S}`;w in d&&d[w]?(Cc.dot(d[w].normal)<=s&&(p.push(E.x,E.y,E.z),p.push(A.x,A.y,A.z)),d[w]=null):C in d||(d[C]={index0:l[v],index1:l[y],normal:Cc.clone()})}}for(const g in d)if(d[g]){const{index0:_,index1:h}=d[g];Ho.fromBufferAttribute(a,_),Go.fromBufferAttribute(a,h),p.push(Ho.x,Ho.y,Ho.z),p.push(Go.x,Go.y,Go.z)}this.setAttribute("position",new Jt(p,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class lu extends Xt{constructor(e=1,t=32,i=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const c=Math.min(o+a,Math.PI);let l=0;const u=[],f=new W,d=new W,p=[],g=[],_=[],h=[];for(let m=0;m<=i;m++){const v=[],y=m/i;let S=0;m===0&&o===0?S=.5/t:m===i&&c===Math.PI&&(S=-.5/t);for(let b=0;b<=t;b++){const E=b/t;f.x=-e*Math.cos(r+E*s)*Math.sin(o+y*a),f.y=e*Math.cos(o+y*a),f.z=e*Math.sin(r+E*s)*Math.sin(o+y*a),g.push(f.x,f.y,f.z),d.copy(f).normalize(),_.push(d.x,d.y,d.z),h.push(E+S,1-y),v.push(l++)}u.push(v)}for(let m=0;m<i;m++)for(let v=0;v<t;v++){const y=u[m][v+1],S=u[m][v],b=u[m+1][v],E=u[m+1][v+1];(m!==0||o>0)&&p.push(y,S,E),(m!==i-1||c<Math.PI)&&p.push(S,b,E)}this.setIndex(p),this.setAttribute("position",new Jt(g,3)),this.setAttribute("normal",new Jt(_,3)),this.setAttribute("uv",new Jt(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new lu(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Jl}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Jl);var Z=(n=>(n[n.Air=0]="Air",n[n.Stone=1]="Stone",n[n.Dirt=2]="Dirt",n[n.Grass=3]="Grass",n[n.Sand=4]="Sand",n[n.Water=5]="Water",n[n.Wood=6]="Wood",n[n.Leaves=7]="Leaves",n[n.Glass=8]="Glass",n[n.Planks=9]="Planks",n[n.Torch=10]="Torch",n[n.DoorBottom=11]="DoorBottom",n[n.DoorTop=12]="DoorTop",n))(Z||{});const ei={0:{name:"air",solid:!1,transparent:!0,kind:"cube",light:0,opacity:0,faces:[0,0,0,0,0,0]},1:{name:"stone",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[3,3,3,3,3,3]},2:{name:"dirt",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[2,2,2,2,2,2]},3:{name:"grass",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[1,1,0,2,1,1]},4:{name:"sand",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[4,4,4,4,4,4]},5:{name:"water",solid:!1,transparent:!0,kind:"cube",light:0,opacity:2,faces:[5,5,5,5,5,5]},6:{name:"wood",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[6,6,7,7,6,6]},7:{name:"leaves",solid:!0,transparent:!0,kind:"cube",light:0,opacity:2,faces:[8,8,8,8,8,8]},8:{name:"glass",solid:!0,transparent:!0,kind:"cube",light:0,opacity:1,faces:[9,9,9,9,9,9]},9:{name:"planks",solid:!0,transparent:!1,kind:"cube",light:0,opacity:15,faces:[10,10,10,10,10,10]},10:{name:"torch",solid:!1,transparent:!0,kind:"torch",light:14,opacity:0,faces:[11,11,11,11,11,11]},11:{name:"door",solid:!0,transparent:!0,kind:"door",light:0,opacity:15,faces:[13,13,13,13,13,13]},12:{name:"doorTop",solid:!0,transparent:!0,kind:"door",light:0,opacity:15,faces:[13,13,13,13,13,13]}};function Mn(n){return n!==0&&!ei[n].transparent}const Ix=[3,1,2,4,6,7,8,9,5,10,11];function Dx(n){return ei[n].faces[2]}function Ux(n,e){return`-${Dx(n)%16*e}px 0px`}function Nx(n){return n===0?0:1|n<<1}function Gh(n){return n===0?0:n>>1&7}function Vh(n,e,t=0){return(n?1:0)|(e&1)<<1|(t&1)<<2}function Ha(n){return(n&1)!==0}function uu(n){return n>>1&1}function du(n){return n>>2&1}function xs(n){return n===11||n===12}function Fx(n,e,t,i){let r;Math.abs(n)>=.001||Math.abs(e)>=.001?r=Math.abs(n)>=Math.abs(e)?0:1:r=i!==0?1:0;const s=(r===1?i:t)<0?1:0;return{axis:r,side:s}}function Ul(n,e,t){return e||t?1:n/8}const Je=16,li=Je*Je*Je,wa=-32,ba=64;function it(n,e,t){return`${n},${e},${t}`}function ut(n,e,t){return n+t*Je+e*Je*Je}function xe(n){return Math.floor(n/Je)}class fu{constructor(){B(this,"chunks",new Map);B(this,"onCellWrite")}count(){return this.chunks.size}hasChunk(e,t,i){return this.chunks.has(it(e,t,i))}getChunk(e,t,i){return this.chunks.get(it(e,t,i))}ensureChunk(e,t,i){const r=it(e,t,i),s=this.chunks.get(r);if(s)return s;const o={cx:e,cy:t,cz:i,blocks:new Uint8Array(li),meta:new Uint8Array(li),wlevel:new Uint8Array(li),wsource:new Uint8Array(li),wplaced:new Uint8Array(li),wstream:new Uint8Array(li),blight:new Uint8Array(li),skylight:new Uint8Array(li),colSum:new Uint8Array(256),dirty:!0,settled:!1,lightSettled:!1,edited:!1,editGen:0,savedGen:0,opaqueMesh:null,transMesh:null};return this.chunks.set(r,o),o}getBlock(e,t,i){const r=this.getChunk(xe(e),xe(t),xe(i));if(!r)return Z.Air;const s=e-r.cx*Je,o=t-r.cy*Je,a=i-r.cz*Je;return r.blocks[ut(s,o,a)]}getMeta(e,t,i){const r=this.getChunk(xe(e),xe(t),xe(i));return r?r.meta[ut(e-r.cx*Je,t-r.cy*Je,i-r.cz*Je)]:0}readCell(e,t,i){const r=this.getChunk(xe(e),xe(t),xe(i));if(!r)return null;const s=ut(e-r.cx*Je,t-r.cy*Je,i-r.cz*Je);return{cx:r.cx,cy:r.cy,cz:r.cz,idx:s,block:r.blocks[s],meta:r.meta[s],l:r.wlevel[s],s:r.wsource[s],p:r.wplaced[s],st:r.wstream[s]}}getWaterHeight(e,t,i){const r=this.getChunk(xe(e),xe(t),xe(i));if(!r)return 0;const s=ut(e-r.cx*Je,t-r.cy*Je,i-r.cz*Je);return Ul(r.wlevel[s],r.wsource[s],r.wstream[s])}getLight(e,t,i){const r=this.getChunk(xe(e),xe(t),xe(i));if(!r)return[0,0];const s=ut(e-r.cx*Je,t-r.cy*Je,i-r.cz*Je);return[r.blight[s],r.skylight[s]]}setBlock(e,t,i,r,s=0,o=!0){var u;const a=this.getChunk(xe(e),xe(t),xe(i));if(!a)return!1;const c=ut(e-a.cx*Je,t-a.cy*Je,i-a.cz*Je);if(a.blocks[c]===r&&a.meta[c]===s)return!1;a.blocks[c]=r,a.meta[c]=s,a.dirty=!0,(u=this.onCellWrite)==null||u.call(this,e,t,i),o&&(a.editGen+=1,a.edited=!0);const l=[[a.cx+1,a.cy,a.cz],[a.cx-1,a.cy,a.cz],[a.cx,a.cy+1,a.cz],[a.cx,a.cy-1,a.cz],[a.cx,a.cy,a.cz+1],[a.cx,a.cy,a.cz-1]];for(const[f,d,p]of l){const g=this.getChunk(f,d,p);g&&(g.dirty=!0)}return!0}isSolid(e,t,i){const r=this.getBlock(e,t,i);return r===Z.Air||r===Z.Torch?!1:xs(r)?!Ha(this.getMeta(e,t,i)):r===Z.Leaves?!0:Mn(r)}removeChunk(e,t,i){return this.chunks.delete(it(e,t,i))}*allChunks(){yield*this.chunks.values()}clear(){this.chunks.clear()}}const Wh=Math.sqrt(3),kx=.5*(Wh-1),ds=(3-Wh)/6,Ox=1/3,Pn=1/6,Rs=n=>Math.floor(n)|0,Xd=new Float64Array([1,1,-1,1,1,-1,-1,-1,1,0,-1,0,1,0,-1,0,0,1,0,-1,0,1,0,-1]),Pc=new Float64Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]);function Xh(n=Math.random){const e=qh(n),t=new Float64Array(e).map(r=>Xd[r%12*2]),i=new Float64Array(e).map(r=>Xd[r%12*2+1]);return function(s,o){let a=0,c=0,l=0;const u=(s+o)*kx,f=Rs(s+u),d=Rs(o+u),p=(f+d)*ds,g=f-p,_=d-p,h=s-g,m=o-_;let v,y;h>m?(v=1,y=0):(v=0,y=1);const S=h-v+ds,b=m-y+ds,E=h-1+2*ds,A=m-1+2*ds,C=f&255,w=d&255;let x=.5-h*h-m*m;if(x>=0){const O=C+e[w],R=t[O],I=i[O];x*=x,a=x*x*(R*h+I*m)}let P=.5-S*S-b*b;if(P>=0){const O=C+v+e[w+y],R=t[O],I=i[O];P*=P,c=P*P*(R*S+I*b)}let V=.5-E*E-A*A;if(V>=0){const O=C+1+e[w+1],R=t[O],I=i[O];V*=V,l=V*V*(R*E+I*A)}return 70*(a+c+l)}}function Bx(n=Math.random){const e=qh(n),t=new Float64Array(e).map(s=>Pc[s%12*3]),i=new Float64Array(e).map(s=>Pc[s%12*3+1]),r=new Float64Array(e).map(s=>Pc[s%12*3+2]);return function(o,a,c){let l,u,f,d;const p=(o+a+c)*Ox,g=Rs(o+p),_=Rs(a+p),h=Rs(c+p),m=(g+_+h)*Pn,v=g-m,y=_-m,S=h-m,b=o-v,E=a-y,A=c-S;let C,w,x,P,V,O;b>=E?E>=A?(C=1,w=0,x=0,P=1,V=1,O=0):b>=A?(C=1,w=0,x=0,P=1,V=0,O=1):(C=0,w=0,x=1,P=1,V=0,O=1):E<A?(C=0,w=0,x=1,P=0,V=1,O=1):b<A?(C=0,w=1,x=0,P=0,V=1,O=1):(C=0,w=1,x=0,P=1,V=1,O=0);const R=b-C+Pn,I=E-w+Pn,N=A-x+Pn,H=b-P+2*Pn,F=E-V+2*Pn,ee=A-O+2*Pn,ne=b-1+3*Pn,U=E-1+3*Pn,K=A-1+3*Pn,se=g&255,X=_&255,j=h&255;let he=.6-b*b-E*E-A*A;if(he<0)l=0;else{const Se=se+e[X+e[j]];he*=he,l=he*he*(t[Se]*b+i[Se]*E+r[Se]*A)}let fe=.6-R*R-I*I-N*N;if(fe<0)u=0;else{const Se=se+C+e[X+w+e[j+x]];fe*=fe,u=fe*fe*(t[Se]*R+i[Se]*I+r[Se]*N)}let Ce=.6-H*H-F*F-ee*ee;if(Ce<0)f=0;else{const Se=se+P+e[X+V+e[j+O]];Ce*=Ce,f=Ce*Ce*(t[Se]*H+i[Se]*F+r[Se]*ee)}let Ne=.6-ne*ne-U*U-K*K;if(Ne<0)d=0;else{const Se=se+1+e[X+1+e[j+1]];Ne*=Ne,d=Ne*Ne*(t[Se]*ne+i[Se]*U+r[Se]*K)}return 32*(l+u+f+d)}}function qh(n){const t=new Uint8Array(512);for(let i=0;i<512/2;i++)t[i]=i;for(let i=0;i<512/2-1;i++){const r=i+~~(n()*(256-i)),s=t[i];t[i]=t[r],t[r]=s}for(let i=256;i<512;i++)t[i]=t[i-256];return t}const Ss=32,Gt=1234;function qd(n){let e=n>>>0;return()=>{e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^e>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function $d(n,e,t){let i=(n^Math.imul(e,2654435769)^Math.imul(t,2246822507))>>>0;return i=Math.imul(i^i>>>13,3432918353)>>>0,i=Math.imul(i^i>>>15,461845907)>>>0,((i^i>>>15)>>>0)/4294967296}class hu{constructor(e){B(this,"n2");B(this,"n3");B(this,"seed");this.seed=e,this.n2=Xh(qd(e)),this.n3=Bx(qd(e^2654435769|0))}heightAt(e,t){const i=[.008,.02,.05,.11],r=[1,.5,.25,.125];let s=0;for(let a=0;a<4;a++)s+=this.n2(e*i[a],t*i[a])*r[a];const o=1+.5+.25+.125;return Math.floor(Ss+s/o*20)}caveAt(e,t,i){return this.n3(e*.06,t*.06,i*.06)}}function pu(n,e,t,i,r){const s=n.ensureChunk(t,i,r),o=t*16,a=i*16,c=r*16;for(let l=0;l<16;l++)for(let u=0;u<16;u++){const f=o+l,d=c+u,p=e.heightAt(f,d);for(let g=0;g<16;g++){const _=a+g,h=ut(l,g,u);if(_>p){s.blocks[h]=_<=Ss?Z.Water:Z.Air;continue}_<p-4?s.blocks[h]=Z.Stone:_<p?s.blocks[h]=Z.Dirt:s.blocks[h]=p<Ss+1?Z.Sand:Z.Grass,(s.blocks[h]===Z.Stone||s.blocks[h]===Z.Dirt)&&_<=Ss&&e.caveAt(f,_,d)>.55&&(s.blocks[h]=Z.Air)}}for(let l=3;l<=12;l++)for(let u=3;u<=12;u++){const f=o+l,d=c+u,p=e.heightAt(f,d);if(p<Ss+1||$d(e.seed,f,d)>=.02)continue;const g=4+Math.floor($d(e.seed^20907|0,f,d)*3);for(let _=0;_<g;_++){const h=p+1+_,m=h-a;h<a||m>=16||(s.blocks[ut(l,m,u)]=Z.Wood)}for(let _=p+g-1;_<=p+g+2;_++){const h=_<p+g?2:1;for(let m=-h;m<=h;m++)for(let v=-h;v<=h;v++){if(Math.abs(m)===h&&Math.abs(v)===h)continue;const y=_-a;if(y<0||y>=16)continue;const S=ut(l+m,y,u+v);s.blocks[S]===Z.Air&&(s.blocks[S]=Z.Leaves)}}}s.dirty=!0}const zx="__meta__";function Hx(n,e,t,i){return`${n}:${e},${t},${i}`}function Lc(n){return`${n}:${zx}`}function hi(n,e){const t={v:2,cx:n.cx,cy:n.cy,cz:n.cz,blocks:n.blocks.slice(),meta:n.meta.slice(),wlevel:n.wlevel.slice(),wsource:n.wsource.slice(),wplaced:n.wplaced.slice(),wstream:n.wstream.slice()};return e&&e.length&&(t.entities=e),t}function Yr(n,e,t,i){const r=n.ensureChunk(e.cx,e.cy,e.cz);r.blocks.set(e.blocks),r.meta.set(e.meta),r.wlevel.set(e.wlevel),r.wsource.set(e.wsource),r.wplaced.set(e.wplaced),r.wstream.set(e.wstream),r.settled=!0,r.edited=!0,r.editGen=1,r.savedGen=1,r.dirty=!1,e.entities&&t&&i&&t.restoreEntities(e.entities,i)}function Gx(n){if(!n||!("v"in n))return null;if(n.v===2&&"entities"in n)return n;const e=n;return"player"in n?{v:2,seed:e.seed,entities:[{id:1,kindId:"player",x:e.player.x,y:e.player.y,z:e.player.z,vx:0,vy:0,vz:0,yaw:e.player.yaw,pitch:e.player.pitch,fly:!1,noclip:!1,controllerKind:"human"}],viewedEntityId:1,time:e.time,hotbar:e.hotbar}:null}class Vx{constructor(){B(this,"data",new Map);B(this,"puts",0);B(this,"deletes",0)}async get(e){return this.data.get(e)}async put(e,t){this.puts++,this.data.set(e,t)}async putMany(e){for(const[t,i]of e)this.puts++,this.data.set(t,i)}async delete(e){this.deletes++,this.data.delete(e)}async keys(e){const t=[...this.data.keys()];return e?t.filter(i=>i.startsWith(e)):t}}const Wx=512;class Nl{constructor(e,t,i){B(this,"store");B(this,"replayStore");B(this,"seed");B(this,"warm",new Map);B(this,"persistedKeys",new Set);B(this,"inFlight",new Map);B(this,"pendingPuts",new Set);B(this,"meta",null);this.store=e,this.seed=t,this.replayStore=i??null}key(e,t,i){return Hx(this.seed,e,t,i)}saveReplay(e,t){var i;(i=this.replayStore)==null||i.putReplay(e,t).catch(()=>{})}loadReplay(e){var t;return((t=this.replayStore)==null?void 0:t.getReplay(e).catch(()=>{}))??Promise.resolve(void 0)}listReplays(){var e;return((e=this.replayStore)==null?void 0:e.listReplays().catch(()=>[]))??Promise.resolve([])}async boot(){if(!this.store)return null;try{const e=await this.store.keys(`${this.seed}:`);for(const i of e)i.startsWith(`${this.seed}:`)&&this.persistedKeys.add(i);const t=await this.store.get(Lc(this.seed));t&&(this.meta=Gx(t))}catch{}return this.meta}hasPersisted(e,t,i){return this.persistedKeys.has(this.key(e,t,i))}syncRecord(e,t,i){return this.warm.get(this.key(e,t,i))}fetchRecord(e,t,i){const r=this.key(e,t,i),s=this.warm.get(r);if(s)return Promise.resolve(s);const o=this.inFlight.get(r);if(o)return o;const a=(async()=>{if(this.store)try{const c=await this.store.get(r);return c&&"cx"in c&&this.cache(r,c),c&&"cx"in c?c:void 0}catch{return}finally{this.inFlight.delete(r)}})();return this.inFlight.set(r,a),a}isDue(e){return e.edited&&!(e.editGen>0&&e.savedGen===e.editGen)}onUnload(e,t){const i=!!t&&t.length>0;if(!e.edited&&!i)return;const r=this.key(e.cx,e.cy,e.cz),s=hi(e,t);if(this.cache(r,s),this.persistedKeys.add(r),!this.isDue(e)&&!i||(e.savedGen=e.editGen,!this.store))return;const o=this.store.put(r,s).catch(()=>{});this.pendingPuts.add(o),o.then(()=>this.pendingPuts.delete(o))}saveLoaded(e,t){if(this.meta=t,!this.store)return;const i=[];for(const s of e){if(!this.isDue(s))continue;const o=this.key(s.cx,s.cy,s.cz),a=hi(s);s.savedGen=s.editGen,this.persistedKeys.add(o),i.push([o,a])}i.push([Lc(this.seed),t]);const r=this.store.putMany(i).catch(()=>{});this.pendingPuts.add(r),r.then(()=>this.pendingPuts.delete(r))}dropPersisted(e,t,i){const r=this.key(e,t,i);this.persistedKeys.delete(r),this.warm.delete(r)}saveMeta(e){if(this.meta=e,!this.store)return;const t=this.store.put(Lc(this.seed),e).catch(()=>{});this.pendingPuts.add(t),t.then(()=>this.pendingPuts.delete(t))}flush(){return Promise.all([...this.pendingPuts]).then(()=>{}).catch(()=>{})}cache(e,t){for(this.warm.has(e)&&this.warm.delete(e),this.warm.set(e,t);this.warm.size>Wx;){const i=this.warm.keys().next().value;this.warm.delete(i)}}}const Xx=new hu(Gt),Sn=2,Cs=0,Ta=4,qx=1,$x=1;function Pr(n,e){let t=1/0;for(const i of e){const r=n.cx-i.cx,s=n.cz-i.cz,o=(r*r+s*s)*100+Math.abs(n.cy-i.cy);o<t&&(t=o)}return t}function $h(n,e,t,i){return Math.abs(n-t)<=Sn&&Math.abs(e-i)<=Sn}function Ps(n,e,t,i,r,s){const o=[[e+1,t,i],[e-1,t,i],[e,t+1,i],[e,t-1,i],[e,t,i+1],[e,t,i-1]];for(const[a,c,l]of o){const u=n.getChunk(a,c,l);u&&$h(a,l,r,s)&&(u.dirty=!0)}}function Yd(n,e,t,i){const r=[],s=[],o=[],a=[],c=[],l=[],u=new Set,f=new Set,d=new Set;for(let h=0;h<e.length;h++){const m=e[h];for(let v=-m.radius;v<=m.radius;v++)for(let y=-m.radius;y<=m.radius;y++)for(let S=Cs;S<=Ta;S++){const b=m.cx+v,E=m.cz+y,A=it(b,S,E);f.add(A),h===0&&m.meshable!==!1&&d.add(A)}}const p=[];for(const h of f){const[m,v,y]=h.split(",").map(Number);if(n.hasChunk(m,v,y))continue;const S=t==null?void 0:t.syncRecord(m,v,y);if(S){Yr(n,S),Ps(n,m,v,y,e[0].cx,e[0].cz),a.push({cx:m,cy:v,cz:y}),u.add(h);continue}if(t!=null&&t.hasPersisted(m,v,y)){c.push({cx:m,cy:v,cz:y});continue}p.push({cx:m,cy:v,cz:y})}p.sort((h,m)=>Pr(h,e)-Pr(m,e)||h.cx-m.cx||h.cy-m.cy||h.cz-m.cz);for(const h of p.slice(0,qx))n.ensureChunk(h.cx,h.cy,h.cz),pu(n,Xx,h.cx,h.cy,h.cz),Ps(n,h.cx,h.cy,h.cz,e[0].cx,e[0].cz),r.push(h),s.push(h),u.add(it(h.cx,h.cy,h.cz));c.sort((h,m)=>Pr(h,e)-Pr(m,e)||h.cx-m.cx||h.cy-m.cy||h.cz-m.cz);const g=[];for(const h of n.allChunks())!h.dirty||u.has(it(h.cx,h.cy,h.cz))||f.has(it(h.cx,h.cy,h.cz))&&g.push({cx:h.cx,cy:h.cy,cz:h.cz});g.sort((h,m)=>Pr(h,e)-Pr(m,e)||h.cx-m.cx||h.cy-m.cy||h.cz-m.cz);for(const h of g.slice(0,$x))r.push(h),o.push(h),u.add(it(h.cx,h.cy,h.cz));const _=[];for(const h of n.allChunks())(!f.has(it(h.cx,h.cy,h.cz))||h.cy<Cs||h.cy>Ta)&&_.push(h);for(const h of _){const m=i?i.entitiesInChunk(h.cx,h.cy,h.cz).map(v=>i.toRecord(v)):void 0;t==null||t.onUnload(h,m),Ps(n,h.cx,h.cy,h.cz,e[0].cx,e[0].cz),n.removeChunk(h.cx,h.cy,h.cz),l.push({cx:h.cx,cy:h.cy,cz:h.cz})}return{rebuilt:r,generated:s,remeshed:o,restored:a,pending:c,unloaded:l,meshable:d}}function mu(n,e,t,i,r,s){return Array.isArray(e)?Yd(n,e,t,i):Yd(n,[{cx:e,cz:t,cy:typeof i=="number"?i:2,radius:Sn,meshable:!0}],r,s)}const Hn=9;class Yx{constructor(e){B(this,"slots");B(this,"selected",0);B(this,"onSelectChange");B(this,"onSlotChange");this.slots=Array.from({length:Hn},(t,i)=>e[i]??e[0]??Z.Stone),e.length>Hn&&(this.slots.length=Hn)}get block(){return this.slots[this.selected]}select(e){var i;const t=(e%Hn+Hn)%Hn;t!==this.selected&&(this.selected=t,(i=this.onSelectChange)==null||i.call(this,t))}cycle(e){this.select(this.selected+(e>=0?1:-1))}setSlot(e,t){var r;const i=(e%Hn+Hn)%Hn;this.slots[i]=t,(r=this.onSlotChange)==null||r.call(this,i)}}const Js=[{dir:[1,0,0],axes:[2,1],corners:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]]},{dir:[-1,0,0],axes:[2,1],corners:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]},{dir:[0,1,0],axes:[0,2],corners:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},{dir:[0,-1,0],axes:[0,2],corners:[[1,0,1],[0,0,1],[0,0,0],[1,0,0]]},{dir:[0,0,1],axes:[0,1],corners:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]},{dir:[0,0,-1],axes:[0,1],corners:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]}],gu=[.6,.6,1,.5,.8,.8],Kx=[1,.8,.62,.48];class Kd{constructor(){B(this,"pos",[]);B(this,"col",[]);B(this,"uv",[]);B(this,"idx",[]);B(this,"light",[]);B(this,"verts",0)}push(e,t,i,r,s,o,a,c){this.pos.push(e,t,i),this.col.push(r,r,r,1),this.uv.push(s,o),this.light.push(a,c),this.verts++}toBuffer(){return this.verts===0?null:{positions:new Float32Array(this.pos),colors:new Float32Array(this.col),uvs:new Float32Array(this.uv),indices:new Uint32Array(this.idx),light:new Float32Array(this.light)}}}const yn=11,jd=12,Lr=13,jx=[0,0,1,4,5],cn=1e-6;function Zx(n,e){if(n===Z.Torch){const r=Gh(e);return r===0?{min:[.41,0,.41],size:[.18,.875,.18]}:r===1?{min:[0,.41,.41],size:[.375,.18,.18]}:r===2?{min:[1-.375,.41,.41],size:[.375,.18,.18]}:r===3?{min:[.41,.41,0],size:[.18,.18,.375]}:{min:[.41,.41,1-.375],size:[.18,.18,.375]}}const t=uu(e)===0,i=du(e);return Ha(e)?{min:[0,0,0],size:t?[1,1,.2]:[.2,1,1]}:t?{min:i===1?[.8,0,0]:[0,0,0],size:[.2,1,1]}:{min:i===1?[0,0,.8]:[0,0,0],size:[1,1,.2]}}function Zd(n,e){const{min:t,size:i}=Zx(n,e),r=[];for(let s=0;s<6;s++){const o=s>>1,a=s&1?t[o]<=cn:t[o]+i[o]>=1-cn;let c=null;if(a){const[l,u]=Js[s].axes;c={u0:t[l],u1:t[l]+i[l],v0:t[u],v1:t[u]+i[u]}}r.push({reach:a,cov:c})}return r}function Jx(n,e){return n.u0<=e.u0+cn&&n.v0<=e.v0+cn&&n.u1>=e.u1-cn&&n.v1>=e.v1-cn}function Qx(n,e){return Math.abs(n.u0-e.u0)<=cn&&Math.abs(n.u1-e.u1)<=cn&&Math.abs(n.v0-e.v0)<=cn&&Math.abs(n.v1-e.v1)<=cn}function eS(n,e){for(let t=0;t<3;t++)if(n[t]!==e[t])return n[t]>e[t];return!1}const Yh=(n,e,t,i,r,s,o)=>{const a=Zd(s,o);return c=>{const l=a[c];if(!l.reach)return!1;const u=Js[c].dir,f=t+u[0],d=i+u[1],p=r+u[2],g=n(f,d,p);if(Mn(g))return!0;if(ei[g].kind==="cube")return!1;const _=Zd(g,e(f,d,p))[c^1];return!_.reach||!Jx(_.cov,l.cov)?!1:!Qx(_.cov,l.cov)||eS([t,i,r],[f,d,p])}};function pi(n,e,t,i,r,s,o,a,c,l){for(let u=0;u<6;u++){if(r(u))continue;if(!o.takeFace())return;const f=Js[u],[d,p]=f.axes,g=i[u],_=g%16,h=g/16|0;for(const v of f.corners){const[y,S]=_u(s,a,c,l,f,v);n.push(e[0]+v[0]*t[0],e[1]+v[1]*t[1],e[2]+v[2]*t[2],gu[u],(_+v[d])/16,(15-h+v[p])/16,y,S)}const m=n.verts-4;n.idx.push(m,m+1,m+2,m,m+2,m+3)}}function tS(n,e,t,i,r,s,o,a,c){const l=Yh(e,t,i,r,s,Z.Torch,o),u=Gh(o);if(u===0){pi(n,[i+.41,r,s+.41],[.18,.875,.18],[yn,yn,jd,yn,yn,yn],l,a,c,i,r,s);return}const f=[yn,yn,yn,yn,yn,yn];f[jx[u]]=jd,u===1?pi(n,[i,r+.41,s+.41],[.375,.18,.18],f,l,a,c,i,r,s):u===2?pi(n,[i+1-.375,r+.41,s+.41],[.375,.18,.18],f,l,a,c,i,r,s):u===3?pi(n,[i+.41,r+.41,s],[.18,.18,.375],f,l,a,c,i,r,s):pi(n,[i+.41,r+.41,s+1-.375],[.18,.18,.375],f,l,a,c,i,r,s)}function nS(n,e,t,i,r,s,o,a,c){const l=Yh(e,t,i,r,s,Z.DoorBottom,o),u=uu(o)===0,f=du(o),d=[Lr,Lr,Lr,Lr,Lr,Lr];Ha(o)?pi(n,[i,r,s],u?[1,1,.2]:[.2,1,1],d,l,a,c,i,r,s):u?pi(n,f===1?[i+.8,r,s]:[i,r,s],[.2,1,1],d,l,a,c,i,r,s):pi(n,f===1?[i,r,s+.8]:[i,r,s],[1,1,.2],d,l,a,c,i,r,s)}function iS(n,e,t,i,r,s,o,a,c){const l=ei[Z.Water].faces[0],u=l%16,f=l/16|0;for(let d=0;d<6;d++){const p=Js[d],g=i+p.dir[0],_=r+p.dir[1],h=s+p.dir[2],m=e(g,_,h);if(Mn(m))continue;const v=m===Z.Water?t(g,_,h):0;if(d===2){if(m===Z.Water&&o>=1-cn)continue}else if(d===3){if(v>=1-cn)continue}else if(m===Z.Water&&o<=v)continue;if(!c.takeFace())return;const[y,S]=p.axes;for(const E of p.corners){const[A,C]=_u(a,i,r,s,p,E);n.push(i+E[0],r+E[1]*o,s+E[2],gu[d],(u+E[y])/16,(15-f+(S===1?E[S]*o:E[S]))/16,A,C)}const b=n.verts-4;n.idx.push(b,b+1,b+2,b,b+2,b+3)}}function _u(n,e,t,i,r,s){const o=r.dir[0],a=r.dir[1],c=r.dir[2],l=r.axes[0],u=r.axes[1],f=s[l]===1?1:-1,d=s[u]===1?1:-1,p=e+o,g=t+a,_=i+c,h=l===0?f:0,m=l===1?f:0,v=l===2?f:0,y=u===0?d:0,S=u===1?d:0,b=u===2?d:0;let E=0,A=0;for(const[C,w,x]of[[0,0,0],[h,m,v],[y,S,b],[h+y,m+S,v+b]]){const[P,V]=n(p+C,g+w,_+x);P>E&&(E=P),V>A&&(A=V)}return[E/15,A/15]}class rS{constructor(e){B(this,"remaining");B(this,"truncated",!1);this.remaining=e}takeFace(){return this.remaining<4?(this.truncated=!0,!1):(this.remaining-=4,!0)}}function vu(n,e,t,i,r,s,o,a){const c=n.getChunk(e,t,i);if(!c)return{mesh:{opaque:null,trans:null},complete:!0};const l=e*16,u=t*16,f=i*16,d=new Kd,p=new Kd,g=new rS(a),_=(v,y,S)=>v>=l&&v<l+16&&y>=u&&y<u+16&&S>=f&&S<f+16?c.blocks[ut(v-l,y-u,S-f)]:n.getBlock(v,y,S),h=(v,y,S)=>v>=l&&v<l+16&&y>=u&&y<u+16&&S>=f&&S<f+16?c.meta[ut(v-l,y-u,S-f)]:n.getMeta(v,y,S),m=(v,y,S)=>{if(!(v>=l&&v<l+16&&y>=u&&y<u+16&&S>=f&&S<f+16))return n.getWaterHeight(v,y,S);const E=ut(v-l,y-u,S-f);return Ul(c.wlevel[E],c.wsource[E],c.wstream[E])};e:for(let v=s;v<o;v++)for(let y=0;y<16;y++)for(let S=0;S<16;S++){const b=c.blocks[ut(S,v,y)];if(b===Z.Air)continue;const E=ei[b].kind,A=l+S,C=u+v,w=f+y;if(E!=="cube"){E==="torch"?tS(d,_,h,A,C,w,c.meta[ut(S,v,y)],r,g):nS(d,_,h,A,C,w,c.meta[ut(S,v,y)],r,g);continue}const x=Mn(b);if(b===Z.Water){const P=Ul(c.wlevel[ut(S,v,y)],c.wsource[ut(S,v,y)],c.wstream[ut(S,v,y)]);iS(p,_,m,A,C,w,P,r,g);continue}for(let P=0;P<6;P++){const V=Js[P],O=A+V.dir[0],R=C+V.dir[1],I=w+V.dir[2],N=_(O,R,I),H=x&&!Mn(N),F=!x&&!Mn(N)&&N!==b;if(!H&&!F)continue;if(!g.takeFace())break e;const ee=H?d:p,[ne,U]=V.axes,K=ei[b].faces[P],se=K%16,X=K/16|0;for(const he of V.corners){const fe=he[ne]===1?1:-1,Ce=he[U]===1?1:-1,Ne=Mn(_(O+(ne===0?fe:0),R+(ne===1?fe:0),I+(ne===2?fe:0)))?1:0,Se=Mn(_(O+(U===0?Ce:0),R+(U===1?Ce:0),I+(U===2?Ce:0)))?1:0,$e=Mn(_(O+(ne===0?fe:0)+(U===0?Ce:0),R+(ne===1?fe:0)+(U===1?Ce:0),I+(ne===2?fe:0)+(U===2?Ce:0)))?1:0,D=Ne&&Se?3:Ne+Se+$e,[ct,Ye]=_u(r,A,C,w,V,he);ee.push(A+he[0],C+he[1],w+he[2],gu[P]*Kx[D],(se+he[ne])/16,(15-X+he[U])/16,ct,Ye)}const j=ee.verts-4;ee.idx.push(j,j+1,j+2,j,j+2,j+3)}}return{mesh:{opaque:d.toBuffer(),trans:p.toBuffer()},complete:!g.truncated}}const sS=()=>[0,0];function oS(n,e,t,i,r=sS){return vu(n,e,t,i,r,0,16,1/0).mesh}function Jd(n,e,t,i,r,s,o){return vu(n,e,t,i,r,s,o,1/0).mesh}function aS(n,e,t,i,r,s){return vu(n,e,t,i,r,0,16,s)}const cS=3764,lS=4;function uS(n,e){const t=new Array(16).fill(0);for(let o=0;o<16;o++)for(let a=0;a<256;a++)n.blocks[o*256+a]!==Z.Air&&t[o]++;const i=t.reduce((o,a)=>o+a,0),r=[0];if(i===0)for(let o=1;o<e;o++)r.push(Math.floor(16*o/e));else{let o=0,a=0;for(let c=1;c<e;c++){const l=i*c/e;for(;a<15&&(a++,o+=t[a-1],!(o>=l)););r.push(a)}}r.push(16);const s=[];for(let o=0;o<e;o++)s.push([r[o],r[o+1]]);return s}function Qd(n){const e=n.filter(g=>g!==null);if(e.length===0)return null;const t=e.reduce((g,_)=>g+_.positions.length/3,0),i=new Float32Array(t*3),r=new Float32Array(t*4),s=new Float32Array(t*2),o=new Float32Array(t*2),a=new Uint32Array(e.reduce((g,_)=>g+_.indices.length,0));let c=0,l=0,u=0,f=0,d=0,p=0;for(const g of e){const _=g.positions.length/3;i.set(g.positions,l),r.set(g.colors,u),s.set(g.uvs,f),o.set(g.light,d);for(let h=0;h<g.indices.length;h++)a[p+h]=g.indices[h]+c;p+=g.indices.length,c+=_,l+=_*3,u+=_*4,f+=_*2,d+=_*2}return{positions:i,colors:r,uvs:s,indices:a,light:o}}function dS(n){return{opaque:Qd(n.map(e=>e.opaque)),trans:Qd(n.map(e=>e.trans))}}class fS{constructor(){B(this,"plans",new Map)}start(e,t){return this.plans.size>0?!1:(this.plans.set(e,{bands:t,next:0,partial:new Array(t.length).fill(null)}),!0)}has(e){return this.plans.has(e)}inFlightKey(){const e=this.plans.keys().next();return e.done?null:e.value}advance(e){const t=this.plans.get(e);return!t||t.next>=t.bands.length?null:t.bands[t.next]}store(e,t){const i=this.plans.get(e);i&&(i.partial[i.next]=t,i.next++)}finish(e){const t=this.plans.get(e);return!t||t.next<t.bands.length?null:(this.plans.delete(e),dS(t.partial.filter(i=>i!==null)))}cancel(e){this.plans.delete(e)}}const Gi="2,1,0",Ic=6312,fs=16.7,ef=25,tf=600,nf=300,hS=10,pS={x:8,y:34,z:200};function Wo(n){let e=0;for(const t of[n.opaque,n.trans])t&&(e+=t.positions.length/3);return e}class mS{constructor(e){B(this,"frame",0);B(this,"seg","A");B(this,"bLeft",nf);B(this,"finished",!1);B(this,"windowStart",null);B(this,"windowEnd",null);B(this,"lastRemeshFrame",null);B(this,"cycles",[]);B(this,"open",null);B(this,"aTotals",[]);B(this,"bTotals",[]);B(this,"drains",[]);B(this,"reason",null);B(this,"opts");this.opts=e}beginFrame(e){const t=this.frame;if(e.worstLoaded&&this.windowStart===null&&(this.windowStart=t),this.seg==="A"){const i=e.worstSettled&&this.lastRemeshFrame!==null&&t-this.lastRemeshFrame>=hS&&this.cycles.some(r=>r.kind==="sliced"&&r.verts===Ic);(i||t+1>=tf)&&(i?this.windowEnd=this.lastRemeshFrame:this.reason=`segment A cap: worst chunk not settled by frame ${tf-1}`,this.seg="B",this.bLeft=nf)}return this.seg==="B"&&this.bLeft--,{waypoint:this.seg==="B"?{...pS}:{...this.opts.anchor}}}noteRemesh(e,t){const i=this.frame;this.lastRemeshFrame=i,e==="probe-complete"?(this.open&&this.pushOpen(),this.cycles.push({kind:"probe-complete",frames:[i],maxFrameMs:0,verts:t})):e==="plan"?(this.open&&this.pushOpen(),this.open={frames:[i],verts:t}):this.open?e==="slice"?this.open.frames.push(i):(this.open.frames.push(i),this.open.verts=t,this.pushOpen()):this.open={frames:[i],verts:t}}pushOpen(){this.open&&(this.cycles.push({kind:"sliced",frames:this.open.frames,maxFrameMs:0,verts:this.open.verts}),this.open=null)}noteFrame(e,t){return(this.seg==="A"?this.aTotals:this.bTotals).push(e),this.drains.push(t),this.frame++,!this.finished&&this.seg==="B"&&this.bLeft<=0?(this.finished=!0,this.report()):null}report(){this.open&&this.pushOpen();const e=[...this.aTotals,...this.bTotals],t=c=>c.reduce((l,u)=>Math.max(l,u),0),i=this.windowStart??this.aTotals.length,r=[];this.reason&&r.push(this.reason),this.windowStart===null?r.push("worst chunk never loaded in segment A"):this.windowEnd===null&&r.push("window never closed: no remesh observed before settle");const s=this.cycles[this.cycles.length-1];if(this.windowStart!==null&&this.windowEnd!==null){(!s||s.kind!=="sliced")&&r.push("settled remesh did not take the slice path"),s&&s.verts!==Ic&&r.push(`settled verts ${s.verts} != node baseline ${Ic} (light-state drift)`);for(const c of this.cycles)for(const l of c.frames)if(e[l]>fs){r.push(`remesh frame ${l}: ${e[l].toFixed(2)} ms > ${fs} ms`);break}for(let c=this.windowStart;c<=this.windowEnd;c++)if(e[c]>fs){r.push(`window frame ${c}: ${e[c].toFixed(2)} ms > ${fs} ms`);break}}const o=t(this.bTotals);o>ef&&r.push(`ocean max ${o.toFixed(2)} ms > ${ef} ms`);const a=c=>c.map(l=>({...l,maxFrameMs:t(l.frames.map(u=>e[u]))}));return{mode:"remesh",seed:this.opts.seed,phase:this.opts.phase,render:this.opts.render,boot:{frames:i,maxMs:t(this.aTotals.slice(0,i))},worstChunk:{key:Gi,settledVerts:s?s.verts:null,window:this.windowStart!==null&&this.windowEnd!==null?[this.windowStart,this.windowEnd]:null,maxWindowMs:this.windowStart!==null&&this.windowEnd!==null?t(e.slice(this.windowStart,this.windowEnd+1)):0,remeshCycles:a(this.cycles)},ocean:{frames:this.bTotals.length,maxMs:o,avgMs:this.bTotals.length?this.bTotals.reduce((c,l)=>c+l,0)/this.bTotals.length:0},global:{maxFrameMs:e[e.reduce((c,l,u)=>l>e[c]?u:c,0)],maxFrameIndex:e.reduce((c,l,u)=>l>e[c]?u:c,0),drainMaxMs:t(this.drains),framesOver16_7:e.map((c,l)=>c>fs?l:-1).filter(c=>c>=0),framesOver25:e.map((c,l)=>c>25?l:-1).filter(c=>c>=0),framesOver33_4:e.map((c,l)=>c>33.4?l:-1).filter(c=>c>=0)},pass:r.length===0,failReason:r.length?r.join("; "):null}}}function rf(n){const e=new Xt;return e.setAttribute("position",new bt(n.positions,3)),e.setAttribute("color",new bt(n.colors,4)),e.setAttribute("uv",new bt(n.uvs,2)),e.setAttribute("aLight",new bt(n.light,2)),e.setIndex(new bt(n.indices,1)),e.computeBoundingSphere(),e}const gS=5.6,_S=3,vS=13,yS=8,xS=28,SS=9.5,MS=.3,ES=1.8,wS=1.62,ks=6;function Fl(n,e,t,i,r){const s=(E,A,C)=>typeof n=="function"?n(E,A,C):n.getBlock(E,A,C),o=r??((E,A,C)=>{const w=s(E,A,C);return w!==Z.Air&&w!==Z.Water});let a=Math.floor(e.x),c=Math.floor(e.y),l=Math.floor(e.z);const u=t.x>=0?1:-1,f=t.y>=0?1:-1,d=t.z>=0?1:-1,p=Math.abs(1/t.x),g=Math.abs(1/t.y),_=Math.abs(1/t.z);let h=t.x>0?(a+1-e.x)*p:t.x<0?(e.x-a)*p:1/0,m=t.y>0?(c+1-e.y)*g:t.y<0?(e.y-c)*g:1/0,v=t.z>0?(l+1-e.z)*_:t.z<0?(e.z-l)*_:1/0,y=0,S=0,b=0;for(;;){if(o(a,c,l))return{x:a,y:c,z:l,nx:y,ny:S,nz:b};if(h<=m&&h<=v){if(h>i)return null;a+=u,h+=p,[y,S,b]=[-u,0,0]}else if(m<=v){if(m>i)return null;c+=f,m+=g,[y,S,b]=[0,-f,0]}else{if(v>i)return null;l+=d,v+=_,[y,S,b]=[0,0,-d]}}}function Kh(n,e,t,i){let r=null;for(let s=0;s<t.length;s++){const o=t[s],a=[[n.x,e.x,o.pos.x-o.kind.half,o.pos.x+o.kind.half],[n.y,e.y,o.pos.y,o.pos.y+o.kind.height],[n.z,e.z,o.pos.z-o.kind.half,o.pos.z+o.kind.half]];let c=0,l=i,u=!0;for(const[f,d,p,g]of a)if(Math.abs(d)<1e-8){if(f<p||f>g){u=!1;break}}else{let _=(p-f)/d,h=(g-f)/d;if(_>h&&([_,h]=[h,_]),_>c&&(c=_),h<l&&(l=h),c>l){u=!1;break}}u&&c<=i&&(r===null||c<r.t)&&(r={index:s,t:c})}return r}const sf=Math.PI/2-.01,hs={player:{id:"player",half:MS,height:ES,eye:wS,walkSpeed:gS,swimSpeed:_S,jumpVel:SS,flySpeed:vS,flyVSpeed:yS,canFly:!0,canNoclip:!0,canEdit:!0,collides:!0},deer:{id:"deer",half:.45,height:.9,eye:.7,walkSpeed:1.6,swimSpeed:1,jumpVel:8,flySpeed:0,flyVSpeed:0,canFly:!1,canNoclip:!1,canEdit:!1,collides:!0},spectator:{id:"spectator",half:.3,height:1.8,eye:1.62,walkSpeed:8,swimSpeed:5,jumpVel:0,flySpeed:8,flyVSpeed:8,canFly:!0,canNoclip:!0,canEdit:!1,collides:!1}},nr={forward:0,strafe:0,up:!1,down:!1,yaw:0,pitch:0,primary:!1,secondary:!1},Or=1e-7,bS=24;function Qs(n){return{x:n.pos.x,y:n.pos.y+n.kind.eye,z:n.pos.z}}function Os(n,e){const t=Math.cos(e);return{x:-Math.sin(n)*t,y:Math.sin(e),z:-Math.cos(n)*t}}function Xo(n,e,t,i){const r=n.pos,s=n.kind;return e<r.x+s.half&&e+1>r.x-s.half&&t<r.y+s.height&&t+1>r.y&&i<r.z+s.half&&i+1>r.z-s.half}function jh(n,e,t,i,r){const s=e.kind,o=Math.floor(t-s.half),a=Math.floor(t+s.half-Or),c=Math.floor(i),l=Math.floor(i+s.height-Or),u=Math.floor(r-s.half),f=Math.floor(r+s.half-Or);for(let d=c;d<=l;d++)for(let p=u;p<=f;p++)for(let g=o;g<=a;g++)if(n.isSolid(g,d,p))return!0;return!1}function TS(n,e,t,i,r){const s=e.kind,o=Math.floor(t-s.half),a=Math.floor(t+s.half-Or),c=Math.floor(i),l=Math.floor(i+s.height-Or),u=Math.floor(r-s.half),f=Math.floor(r+s.half-Or);for(let d=c;d<=l;d++)for(let p=u;p<=f;p++)for(let g=o;g<=a;g++)if(n.getBlock(g,d,p)===Z.Water)return!0;return!1}function of(n,e,t){const i=Math.sin(n),r=Math.cos(n);let s=-i*e+r*t,o=-r*e-i*t;const a=Math.hypot(s,o);return a>1&&(s/=a,o/=a),{x:s,z:o}}function Dc(n,e,t,i){if(i===0)return!1;const r=e.pos,s=c=>jh(n,e,r.x+(t===0?i*c:0),r.y+(t===1?i*c:0),r.z+(t===2?i*c:0));if(!s(1))return t===0?r.x+=i:t===1?r.y+=i:r.z+=i,!1;let o=0,a=1;for(let c=0;c<bS;c++){const l=(o+a)/2;s(l)?a=l:o=l}return t===0?r.x+=i*o:t===1?r.y+=i*o:r.z+=i*o,!0}function kl(n,e,t,i){const r=e.pos,s=e.vel,o=e.kind;if(e.yaw=t.yaw,e.pitch=t.pitch,e.headInWater=n.getBlock(Math.floor(r.x),Math.floor(r.y+o.eye),Math.floor(r.z))===Z.Water,e.inWater=e.headInWater||TS(n,e,r.x,r.y,r.z),o.collides&&e.noclip){const l=of(e.yaw,t.forward,t.strafe);s.x=l.x*o.flySpeed,s.z=l.z*o.flySpeed,s.y=t.up?o.flyVSpeed:t.down?-o.flyVSpeed:0,r.x+=s.x*i,r.y+=s.y*i,r.z+=s.z*i,e.onGround=!1;return}e.fly?s.y=t.up?o.flyVSpeed:t.down?-o.flyVSpeed:0:(s.y-=xS*i,e.inWater?(t.up&&(s.y=Math.min(s.y+30*i,o.swimSpeed)),s.y=Math.max(s.y,-o.swimSpeed*.6)):t.up&&e.onGround&&(s.y=o.jumpVel));const a=e.fly?o.flySpeed:e.inWater?o.swimSpeed:o.walkSpeed,c=of(e.yaw,t.forward,t.strafe);s.x=c.x*a,s.z=c.z*a,o.collides?(Dc(n,e,0,s.x*i),Dc(n,e,2,s.z*i),Dc(n,e,1,s.y*i)&&(s.y=0),e.onGround=jh(n,e,r.x,r.y-.02,r.z)):(r.x+=s.x*i,r.y+=s.y*i,r.z+=s.z*i,e.onGround=!1)}function Zh(n,e){const t=e.springTarget;if(t)return(i,r,s)=>{const o=n.getBlock(i,r,s);return o!==Z.Air&&o!==Z.Water?!0:o===Z.Water&&t(i,r,s)}}function AS(n,e,t){return e>0?0:n>0?1:n<0?2:t>0?3:4}function Jh(n,e,t,i){const r=n.getBlock(e,t,i);return r===Z.DoorBottom&&n.getBlock(e,t+1,i)===Z.DoorTop?[e,t+1,i]:r===Z.DoorTop&&n.getBlock(e,t-1,i)===Z.DoorBottom?[e,t-1,i]:null}function af(n,e,t,i,r){var o,a;const s=Jh(n,e,t,i);s&&(n.setBlock(s[0],s[1],s[2],Z.Air),(o=r.waterEdit)==null||o.call(r,s[0],s[1],s[2],Z.Air),(a=r.onEdit)==null||a.call(r,s[0],s[1],s[2]))}function RS(n,e,t,i,r){var l,u;const s=n.getBlock(e,t,i),o=n.getMeta(e,t,i),a=Vh(!Ha(o),uu(o),du(o));n.setBlock(e,t,i,s,a),(l=r.onEdit)==null||l.call(r,e,t,i);const c=Jh(n,e,t,i);c&&(n.setBlock(c[0],c[1],c[2],n.getBlock(c[0],c[1],c[2]),a),(u=r.onEdit)==null||u.call(r,c[0],c[1],c[2]))}function CS(n,e,t,i){var o,a,c,l,u,f,d,p,g,_;if(t.toggleFly&&e.kind.canFly&&(e.fly=!e.fly),t.toggleNoclip&&e.kind.canNoclip&&(e.noclip=!e.noclip),!e.kind.canEdit)return;const r=Qs(e),s=Os(e.yaw,e.pitch);if(t.primary){const h=Fl(n,r,s,ks,Zh(n,i));if(!h)return;const m=n.getBlock(h.x,h.y,h.z);xs(m)&&af(n,h.x,h.y,h.z,i),n.setBlock(h.x,h.y,h.z,Z.Air),(o=i.waterEdit)==null||o.call(i,h.x,h.y,h.z,Z.Air),(a=i.onEdit)==null||a.call(i,h.x,h.y,h.z);return}if(t.secondary){const h=Fl(n,r,s,ks);if(!h)return;const m=n.getBlock(h.x,h.y,h.z),v=h.x+h.nx,y=h.y+h.ny,S=h.z+h.nz;if(y<wa||y>=ba)return;const b=n.getBlock(v,y,S),E=t.block??Z.Stone;if(xs(m)){RS(n,h.x,h.y,h.z,i);return}if(E===Z.Torch){if(b!==Z.Air||h.ny<0||!Mn(m)||!e.noclip&&Xo(e,v,y,S))return;n.setBlock(v,y,S,Z.Torch,Nx(AS(h.nx,h.ny,h.nz))),(c=i.waterEdit)==null||c.call(i,v,y,S,Z.Torch),(l=i.onEdit)==null||l.call(i,v,y,S);return}if(E===Z.DoorBottom){if(y+1>=ba)return;const A=n.getBlock(v,y+1,S);if(b!==Z.Air&&b!==Z.Water||A!==Z.Air&&A!==Z.Water||!e.noclip&&(Xo(e,v,y,S)||Xo(e,v,y+1,S)))return;const C=Os(e.yaw,e.pitch),w=Math.hypot(C.x,C.z),{axis:x,side:P}=Fx(w>=.001?C.x/w:0,w>=.001?C.z/w:0,h.nx,h.nz),V=Vh(!1,x,P);n.setBlock(v,y,S,Z.DoorBottom,V),n.setBlock(v,y+1,S,Z.DoorTop,V),(u=i.waterEdit)==null||u.call(i,v,y,S,Z.DoorBottom),(f=i.onEdit)==null||f.call(i,v,y,S),(d=i.waterEdit)==null||d.call(i,v,y+1,S,Z.DoorTop),(p=i.onEdit)==null||p.call(i,v,y+1,S);return}if(b!==Z.Air&&b!==Z.Water&&b!==Z.Torch&&!xs(b)||!e.noclip&&Xo(e,v,y,S))return;xs(b)&&af(n,v,y,S,i),n.setBlock(v,y,S,E),(g=i.waterEdit)==null||g.call(i,v,y,S,E),(_=i.onEdit)==null||_.call(i,v,y,S)}}class Ga{constructor(e){B(this,"a");this.a=e>>>0}next(){this.a|=0,this.a=this.a+1831565813|0;let e=Math.imul(this.a^this.a>>>15,1|this.a);return e=e+Math.imul(e^this.a>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}state(){return this.a>>>0}restore(e){this.a=e>>>0}}function PS(n){return(n^1592594996)>>>0}function LS(n,e,t,i,r){const s=-Math.sin(r),o=-Math.cos(r),a=Math.floor(e+s),c=Math.floor(i+o),l=Math.floor(t);return n(a,l,c)===Z.Water?"water":n(a,l-1,c)===Z.Air&&n(a,l-2,c)===Z.Air&&n(a,l-3,c)===Z.Air?"drop":null}function IS(n,e,t,i,r){const s=Math.floor(e),o=Math.floor(t),a=Math.floor(i);let c=null;for(let l=-r;l<=r;l++)for(let u=-r;u<=r;u++){const f=s+u,d=a+l;for(let p=o-1;p<=o+1;p++)if(n(f,p,d)===Z.Grass&&n(f,p+1,d)===Z.Air){const g=u*u+l*l;(!c||g<c.d)&&(c={x:f,z:d,d:g})}}return c?{x:c.x,z:c.z}:null}class Va{constructor(e,t){B(this,"world");B(this,"rand");B(this,"mode","wander");B(this,"ticksLeft",0);B(this,"heading");B(this,"stall",0);B(this,"lastX",0);B(this,"lastZ",0);B(this,"first",!0);this.world=e,this.rand=t,this.heading=t()*Math.PI*2,this.ticksLeft=60+Math.floor(t()*150)}intent(e,t){const i={...nr,yaw:this.heading,pitch:e.pitch};if(this.first&&(this.lastX=e.pos.x,this.lastZ=e.pos.z,this.first=!1),this.ticksLeft<=0)if(this.mode==="wander")this.mode="idle",this.ticksLeft=30+Math.floor(this.rand()*60);else if(this.mode="wander",this.ticksLeft=60+Math.floor(this.rand()*150),this.rand()<.5){const r=IS(this.world,e.pos.x,e.pos.y,e.pos.z,8);this.heading=r?Math.atan2(-(r.x-e.pos.x),-(r.z-e.pos.z)):this.rand()*Math.PI*2}else this.heading=this.rand()*Math.PI*2;if(this.ticksLeft--,this.mode==="wander"){LS(this.world,e.pos.x,e.pos.y,e.pos.z,this.heading)===null&&(i.forward=1);const r=Math.hypot(e.pos.x-this.lastX,e.pos.z-this.lastZ);i.forward===1&&r<.005?++this.stall>30&&(this.heading=this.rand()*Math.PI*2,this.stall=0):this.stall=0}return this.lastX=e.pos.x,this.lastZ=e.pos.z,i}}function DS(n){return n instanceof Qh?"human":n instanceof Ol?"script":n instanceof Va?"mob":n instanceof jt?"idle":"unknown"}class yu{constructor(e,t,i){B(this,"entities",new Map);B(this,"viewedId",0);B(this,"homeId",0);B(this,"ghostId",0);B(this,"respawn",{x:0,y:0,z:0});B(this,"rng");B(this,"onIntent");B(this,"onSpawn");B(this,"onDespawn");B(this,"world");B(this,"hooks");B(this,"nextId",1);this.world=e,this.hooks=t,this.rng=new Ga(PS(i))}all(){const e=[];for(const t of[...this.entities.keys()].sort((i,r)=>i-r))e.push(this.entities.get(t));return e}viewed(){return this.entities.get(this.viewedId)}setViewed(e){this.entities.has(e)&&(this.viewedId=e)}spawn(e,t,i={}){var o;const r=hs[i.kindId??"player"]??hs.player,s={id:this.nextId++,kind:r,pos:{...e},vel:{x:0,y:0,z:0},yaw:i.yaw??0,pitch:i.pitch??0,onGround:!1,inWater:!1,headInWater:!1,fly:!1,noclip:!1,controller:t,baseController:i.baseController??t};return this.entities.set(s.id,s),this.viewedId===0&&(this.viewedId=s.id),(o=this.onSpawn)==null||o.call(this,s),s}despawn(e){var i;const t=this.entities.get(e);if(t&&((i=this.onDespawn)==null||i.call(this,t)),this.entities.delete(e),this.viewedId===e){this.viewedId=0;const r=this.all()[0];r!==void 0&&(this.viewedId=r.id)}}chunkLoaded(e){return this.world.hasChunk(xe(e.pos.x),xe(e.pos.y),xe(e.pos.z))}tick(e,t){var i;for(const r of this.all()){if(!this.chunkLoaded(r))continue;const s=r.controller.intent(r,t);(i=this.onIntent)==null||i.call(this,t,r,s),CS(this.world,r,s,this.hooks),kl(this.world,r,s,e)}for(const r of this.all())r.pos.y<wa&&(r.kind.id==="player"?(r.pos={...this.respawn},r.vel={x:0,y:0,z:0}):this.despawn(r.id))}toRecord(e){return{id:e.id,kindId:e.kind.id,x:e.pos.x,y:e.pos.y,z:e.pos.z,vx:e.vel.x,vy:e.vel.y,vz:e.vel.z,yaw:e.yaw,pitch:e.pitch,fly:e.fly,noclip:e.noclip,controllerKind:DS(e.controller)}}entitiesInChunk(e,t,i){return this.all().filter(r=>xe(r.pos.x)===e&&xe(r.pos.y)===t&&xe(r.pos.z)===i)}restoreEntity(e,t){if(this.entities.has(e.id))return null;const i=hs[e.kindId]??(e.kindId==="dolt"?hs.deer:hs.player),r={id:e.id,kind:i,pos:{x:e.x,y:e.y,z:e.z},vel:{x:e.vx,y:e.vy,z:e.vz},yaw:e.yaw,pitch:e.pitch,onGround:!1,inWater:!1,headInWater:!1,fly:e.fly,noclip:e.noclip,controller:t,baseController:t};return this.entities.set(r.id,r),this.nextId=Math.max(this.nextId,r.id+1),r}restoreEntities(e,t){for(const i of e)this.restoreEntity(i,t(i))}}class Qh{constructor(e,t=0,i=0){B(this,"keys");B(this,"heldBlock",Z.Stone);B(this,"frozen",!1);B(this,"yaw");B(this,"pitch");B(this,"primaryEdge",!1);B(this,"secondaryEdge",!1);B(this,"toggleFlyEdge",!1);B(this,"toggleNoclipEdge",!1);B(this,"selectSlot");this.keys=e,this.yaw=t,this.pitch=i}setLook(e,t){this.yaw=e,this.pitch=t}getLook(){return{yaw:this.yaw,pitch:this.pitch}}mouse(e,t){this.yaw-=e*.0025,this.pitch=Math.max(-sf,Math.min(sf,this.pitch-t*.0025))}primary(){this.primaryEdge=!0}secondary(){this.secondaryEdge=!0}toggleFly(){this.toggleFlyEdge=!0}toggleNoclip(){this.toggleNoclipEdge=!0}select(e){this.selectSlot=e}intent(e,t){if(this.frozen)return{forward:0,strafe:0,up:!1,down:!1,yaw:e.yaw,pitch:e.pitch,primary:!1,secondary:!1};const i={forward:(this.keys.has("KeyW")?1:0)-(this.keys.has("KeyS")?1:0),strafe:(this.keys.has("KeyD")?1:0)-(this.keys.has("KeyA")?1:0),up:this.keys.has("Space"),down:this.keys.has("ShiftLeft")||this.keys.has("ShiftRight"),yaw:this.yaw,pitch:this.pitch,primary:this.primaryEdge,secondary:this.secondaryEdge,block:this.heldBlock};return this.toggleFlyEdge&&(i.toggleFly=!0),this.toggleNoclipEdge&&(i.toggleNoclip=!0),this.selectSlot!==void 0&&(i.select=this.selectSlot),this.primaryEdge=!1,this.secondaryEdge=!1,this.toggleFlyEdge=!1,this.toggleNoclipEdge=!1,this.selectSlot=void 0,i}}class jt{intent(e,t){return{...nr,yaw:e.yaw,pitch:e.pitch}}}const US=n=>Math.max(-1,Math.min(1,n));class Ol{constructor(e,t=!1){B(this,"steps");B(this,"repeat");B(this,"si",0);B(this,"ticksLeft",0);this.steps=e,this.repeat=t,this.beginStep()}ticksFor(e){switch(e.op){case"walkTo":return e.timeout;case"dig":return e.ticks;case"place":return e.ticks;case"wait":return e.ticks;case"lookAt":return 1}}beginStep(){const e=this.steps[this.si];this.ticksLeft=e?this.ticksFor(e):0}nextStep(){if(this.si++,this.si>=this.steps.length)if(this.repeat)this.si=0;else return;this.beginStep()}intent(e,t){const i=this.steps[this.si];if(!i)return{...nr,yaw:e.yaw,pitch:e.pitch};const r={...nr,yaw:e.yaw,pitch:e.pitch};switch(i.op){case"walkTo":{const s=i.x-e.pos.x,o=i.z-e.pos.z;Math.hypot(s,o)>.4&&(r.yaw=Math.atan2(-s,-o),r.forward=1);break}case"lookAt":{const s=Qs(e),o=i.x-s.x,a=i.y-s.y,c=i.z-s.z,l=Math.hypot(o,a,c)||1,u=o/l,f=a/l,d=c/l;r.yaw=Math.atan2(-u,-d),r.pitch=Math.asin(US(f));break}case"dig":r.primary=!0;break;case"place":r.secondary=!0,r.block=i.block;break}return this.ticksLeft--,this.ticksLeft<=0&&this.nextStep(),r}}function NS(n,e,t){const i=n.viewed();i&&i.id!==t&&(i.controller=i.baseController);const r=n.entities.get(t);r&&(r.controller=e,n.setViewed(t))}function cf(n,e){if(n.homeId===0)return;const t=n.viewed();t&&t.id!==n.homeId&&(t.controller=t.baseController);const i=n.entities.get(n.homeId);i&&(i.controller=e,n.setViewed(n.homeId))}function FS(n,e){if(n.ghostId===0)return;const t=n.viewed();t&&t.id!==n.ghostId&&(t.controller=t.baseController);const i=n.entities.get(n.ghostId);i&&(i.controller=e,n.setViewed(n.ghostId))}function kS(n,e,t){if(n.viewedId!==n.homeId&&n.viewedId!==n.ghostId){cf(n,e);return}t!==null?NS(n,e,t):n.viewedId===n.homeId?FS(n,e):cf(n,e)}function OS(n,e){return n.all().filter(t=>t.id!==n.viewedId&&t.id!==n.ghostId&&(t.kind.id!=="player"||t.id===n.homeId)&&t.controller!==e)}function BS(n,e,t,i){return n(e,t,i)===Z.Grass&&n(e,t+1,i)===Z.Air&&n(e,t+2,i)===Z.Air&&t>=-20&&t<=48}function zS(n,e,t,i,r,s){const o=(c,l,u)=>n.getBlock(c,l,u),a=[];for(let c=0;c<400&&a.length<i;c++){const l=Math.floor(r()*16),u=Math.floor(r()*16),f=e*16+l,d=t*16+u;let p=48;for(;p>=-20&&o(f,p,d)===Z.Air;)p--;p>=-20&&BS(o,f,p,d)&&!s(f,p+1,d)&&a.push({x:f+.5,y:p+1,z:d+.5})}return a}function HS(n,e,t,i,r=2){if(e.all().filter(l=>l.kind.id==="deer"&&xe(l.pos.x)===t&&xe(l.pos.z)===i).length>=r)return;const o=(l,u,f)=>n.getBlock(l,u,f),a=(l,u,f)=>e.all().some(d=>d.kind.id==="deer"&&Math.round(d.pos.x)===l&&Math.round(d.pos.z)===f),c=new Ga(t*73856093^i*19349663);for(const l of zS(n,t,i,r,()=>c.next(),a)){const u=new Va(o,()=>e.rng.next());e.spawn(l,u,{kindId:"deer",baseController:u})}}function GS(){return{phase:0}}function VS(n){return Math.hypot(n.vel.x,n.vel.z)}function WS(n,e,t,i){n.phase+=VS(e)*t*i}function XS(n,e=.5){const t=Math.sin(n.phase)*e;return[t,-t,-t,t].map(i=>i===0?0:i)}const qS=[{name:"body",size:[.5,.5,.9],offset:[0,.55,0]},{name:"head",size:[.35,.35,.4],offset:[0,.78,-.5],head:!0},{name:"legFL",size:[.16,.4,.16],offset:[.28,.2,-.3],leg:0},{name:"legFR",size:[.16,.4,.16],offset:[.28,.2,.3],leg:1},{name:"legBL",size:[.16,.4,.16],offset:[-.28,.2,-.3],leg:2},{name:"legBR",size:[.16,.4,.16],offset:[-.28,.2,.3],leg:3}],$S=[{name:"body",size:[.5,.9,.3],offset:[0,.9,0]},{name:"head",size:[.4,.4,.4],offset:[0,1.5,0],head:!0},{name:"legL",size:[.2,.9,.2],offset:[-.15,.45,0],leg:0},{name:"legR",size:[.2,.9,.2],offset:[.15,.45,0],leg:1}],YS={deer:10124111,player:4157365},KS={deer:6,player:4};function ep(n,e){const t=new Ga(e),i=32,r=document.createElement("canvas");r.width=r.height=i;const s=r.getContext("2d"),o=n>>16&255,a=n>>8&255,c=n&255,l=d=>Math.max(0,Math.min(255,d)),u=s.createImageData(i,i);for(let d=0;d<i*i;d++){const p=Math.floor((t.next()-.5)*48);u.data[d*4+0]=l(o+p),u.data[d*4+1]=l(a+p),u.data[d*4+2]=l(c+p),u.data[d*4+3]=255}s.putImageData(u,0,0);const f=new $r(r);return f.magFilter=Ct,f}function jS(n,e){const t=n.id==="deer"?qS:n.id==="player"?$S:null;if(!t)return null;const i=new $i,r=new $i,s=[];for(const o of t){const a=new Wt(new sr(o.size[0],o.size[1],o.size[2]),e);if(o.head){a.position.set(...o.offset),r.add(a);continue}if(o.leg!==void 0){const c=new $i;c.position.set(0,o.offset[1]+o.size[1]/2,0),a.position.set(o.offset[0],-o.size[1]/2,o.offset[2]),c.add(a),i.add(c),s[o.leg]=c;continue}a.position.set(...o.offset),i.add(a)}return i.add(r),{root:i,head:r,legs:s}}function ZS(n,e,t,i=.5){n.root.position.set(e.pos.x,e.pos.y,e.pos.z),n.root.rotation.y=e.yaw,n.head.rotation.x=e.pitch;const r=XS(t,i);for(let s=0;s<n.legs.length;s++)n.legs[s].rotation.x=r[s]??0}const Fi=[[1,0],[-1,0],[0,1],[0,-1]],JS=[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0],[0,-1,0]],QS=2e3,Gn=0,lf={b:Z.Air,l:0,s:0,p:0,st:0};class tp{constructor(e){B(this,"world");B(this,"queue",new Set);B(this,"touched",new Set);B(this,"stats",{seeds:0,processes:0,queueAdds:0,equalizeFills:0});B(this,"settling",null);B(this,"editQueue",new Set);B(this,"waiting",new Map);B(this,"springs",new Set);this.world=e}solid(e){return e!==Z.Air&&ei[e].solid}inBand(e){return e>=wa&&e<ba}cellState(e,t,i){if(!this.inBand(t))return lf;const r=this.world.getChunk(xe(e),xe(t),xe(i));if(!r)return lf;const s=ut(e-r.cx*16,t-r.cy*16,i-r.cz*16);return{b:r.blocks[s],l:r.wlevel[s],s:r.wsource[s],p:r.wplaced[s],st:r.wstream[s]}}setState(e,t,i,r,s,o,a,c,l=!1){var d,p;if(!this.inBand(t))return;const u=this.world.getChunk(xe(e),xe(t),xe(i));if(!u)return;const f=ut(e-u.cx*16,t-u.cy*16,i-u.cz*16);u.wlevel[f]=r,u.wsource[f]=s,u.wplaced[f]=a,u.wstream[f]=c,u.blocks[f]!==o&&this.world.setBlock(e,t,i,o,0,l)&&this.touched.add(it(u.cx,u.cy,u.cz)),(p=(d=this.world).onCellWrite)==null||p.call(d,e,t,i)}writeCell(e,t,i,r,s,o,a=0,c=0,l=!1){const u=this.cellState(e,t,i);u.b===o&&u.l===r&&u.s===s&&u.p===a&&u.st===c||(this.setState(e,t,i,r,s,o,a,c,l),this.remark(e,t,i,l))}enqueue(e,t,i){this.queue.add(`${e},${t},${i}`),this.stats.queueAdds++;for(const[r,s]of Fi)this.queue.add(`${e+r},${t},${i+s}`);this.queue.add(`${e},${t+1},${i}`),this.queue.add(`${e},${t-1},${i}`)}push(e,t){this.queue.add(e),t&&this.editQueue.add(e)}remark(e,t,i,r){this.push(`${e},${t},${i}`,r);for(const[s,o]of Fi)this.push(`${e+s},${t},${i+o}`,r);this.push(`${e},${t+1},${i}`,r),this.push(`${e},${t-1},${i}`,r)}settleSeed(e){const t=e.cx*16,i=e.cy*16,r=e.cz*16;for(let o=0;o<e.blocks.length;o++)e.blocks[o]===Z.Water&&(e.wlevel[o]===7&&e.wsource[o]===1||(e.wlevel[o]=7,e.wsource[o]=1,e.wplaced[o]=0,e.wstream[o]=0,this.stats.seeds++));const s=(o,a,c,l,u)=>{const f=this.world.getChunk(o,e.cy,a);return f?f.blocks[ut(c,l,u)]===Z.Air:!0};for(let o=0;o<16;o++)for(let a=0;a<16;a++)for(let c=0;c<16;c++){const l=c+a*16+o*256;if(e.blocks[l]!==Z.Water)continue;const u=t+c,f=i+o,d=r+a;if(o>0){if(e.blocks[l-256]===Z.Air){this.enqueue(u,f,d);continue}}else{const g=this.world.getChunk(e.cx,e.cy-1,e.cz);if(f-1<wa||f-1>=ba||!g||g.blocks[ut(c,15,a)]===Z.Air){this.enqueue(u,f,d);continue}}let p=!1;(c>0&&e.blocks[l-1]===Z.Air||c<15&&e.blocks[l+1]===Z.Air||a>0&&e.blocks[l-16]===Z.Air||a<15&&e.blocks[l+16]===Z.Air||c===0&&s(e.cx-1,e.cz,15,o,a)||c===15&&s(e.cx+1,e.cz,0,o,a)||a===0&&s(e.cx,e.cz-1,c,o,15)||a===15&&s(e.cx,e.cz+1,c,o,0))&&(p=!0),p&&this.enqueue(u,f,d)}}process(e,t,i,r=!1){this.stats.processes++;const s=this.cellState(e,t,i);if(s.b!==Z.Water)return;const o=this.world.getChunk(xe(e),xe(t),xe(i));if(o&&!o.settled&&o!==this.settling&&s.l===0&&s.s===0)return;if(s.p===1){this.healSourceBody(e,t,i,r),this.spreadToAir(e,t,i,s.l,r);return}const a=this.cellState(e,t-1,i);if(a.b===Z.Air&&t>Gn*16){if(!(t-1<Gn*16||this.world.hasChunk(xe(e),xe(t-1),xe(i)))){this.waiting.set(`${e},${t},${i}`,r);return}let u=this.cellState(e,t+1,i).b===Z.Water;if(!u){for(const[f,d]of Fi)if(this.cellState(e+f,t,i+d).b===Z.Water){u=!0;break}}if(u){this.dropColumn(e,t-1,i,0,0,r),this.push(`${e},${t-1},${i}`,r);return}this.writeCell(e,t,i,0,0,Z.Air,0,0,r),this.dropColumn(e,t-1,i,s.s,0,r);return}if(s.s===1)return;if(a.b===Z.Water){const l=this.cellState(e,t-2,i);if(!(a.st===1||a.l===7||t-2<Gn*16||this.solid(l.b))){this.writeCell(e,t,i,0,0,Z.Air,0,0,r);return}let f=this.cellState(e,t+1,i).b===Z.Water;if(!f)for(const[d,p]of Fi){const g=this.cellState(e+d,t,i+p);if(g.b===Z.Water){if(g.p===1){f=!0;break}if(g.l===7&&g.st===1&&this.cellState(e+d,t+1,i+p).b===Z.Water){f=!0;break}}}if(f)return;if(s.st===1){this.writeCell(e,t,i,s.l,s.s,Z.Water,s.p,0,r);return}}let c=this.feedLevel(e,t,i,s);if(c===0){this.writeCell(e,t,i,0,0,Z.Air,0,0,r),this.push(`${e},${t-1},${i}`,r);return}(c!==s.l||s.st!==0)&&(this.writeCell(e,t,i,c,s.s,Z.Water,s.p,0,r),c>s.l&&this.push(`${e},${t-1},${i}`,r)),c>=2&&this.spreadToAir(e,t,i,c,r)}feedLevel(e,t,i,r){if(r.p===1)return 7;const s=this.cellState(e,t+1,i);if(s.b===Z.Water&&s.l===7)return 7;const o=new Set([`${e},${t},${i}`]);let a=[`${e},${t},${i}`];for(let c=1;c<=6;c++){const l=[];for(const u of a){const[f,d,p]=u.split(",").map(Number);for(const[g,_,h]of JS){const m=f+g,v=d+_,y=p+h,S=`${m},${v},${y}`;if(o.has(S))continue;o.add(S);const b=this.cellState(m,v,y);if(b.b===Z.Water){if(b.p===1||b.s===0&&b.l===7&&v>=t)return 7-c;l.push(S)}}}if(a=l,a.length===0)return 0}return 0}healSourceBody(e,t,i,r=!1){if(t-1>=Gn*16&&this.cellState(e,t-1,i).b===Z.Air)for(const[o,a]of Fi){const c=this.cellState(e+o,t-1,i+a);if(c.b===Z.Water&&c.s===1&&c.p===1){this.spawnSource(e,t-1,i,r);return}}for(const[s,o]of Fi){if(this.cellState(e+s,t,i+o).b!==Z.Air)continue;const c=this.cellState(e+2*s,t,i+2*o);if(!(c.b===Z.Water&&c.s===1&&c.p===1))continue;const l=s!==0?0:1,u=s!==0?1:0,f=this.cellState(e+s+l,t,i+o+u),d=this.cellState(e+s-l,t,i+o-u),p=this.cellState(e+s,t+1,i+o);(f.b===Z.Water&&f.s===1||d.b===Z.Water&&d.s===1||p.b===Z.Water&&p.s===1)&&this.spawnSource(e+s,t,i+o,r)}}spawnSource(e,t,i,r=!1){this.writeCell(e,t,i,7,1,Z.Water,1,0,r),this.springs.add(`${e},${t},${i}`)}spreadToAir(e,t,i,r,s=!1){if(!(r<2))for(const[o,a]of Fi){const c=e+o,l=i+a;this.cellState(c,t,l).b===Z.Air&&this.world.hasChunk(xe(c),xe(t),xe(l))&&this.writeCell(c,t,l,r-1,0,Z.Water,0,0,s)}}dropColumn(e,t,i,r=0,s=0,o=!1){let a="connects",c=t;for(let l=t;l>=Gn*16;l--){if(this.cellState(e,l,i).b!==Z.Air){a="connects",c=l-1;break}if(l===Gn*16){a="worldfloor",c=l;break}if(!this.world.hasChunk(xe(e),xe(l-1),xe(i))){a="edge",c=l;break}const f=this.cellState(e,l-1,i);if(f.b!==Z.Air){if(c=l,f.b===Z.Water){const d=this.cellState(e,l-2,i);a=this.solid(d.b)||l-2<Gn*16?"sheet":"deep"}else a="solid";break}}if(a!=="deep"&&!(a==="connects"&&c>=t)){for(let l=t;l>c;l--)this.writeCell(e,l,i,7,r,Z.Water,s,1,o);if(a!=="connects"){const l=a==="solid"||a==="worldfloor"?0:1;this.writeCell(e,c,i,7,r,Z.Water,s,l,o)}}}tick(e){for(const[i,r]of this.waiting)this.push(i,r);this.waiting.clear();for(const i of this.springs){const[r,s,o]=i.split(",").map(Number);this.cellState(r,s,o).p===1?this.push(i,!0):this.springs.delete(i)}let t=0;for(;t<e;){const i=this.queue.values().next();if(i.done)break;const r=i.value,s=this.editQueue.has(r);this.queue.delete(r),this.editQueue.delete(r);const[o,a,c]=r.split(",").map(Number);this.process(o,a,c,s),t++}return t}settle(e,t,i){const r=this.world.getChunk(e,t,i);if(!r||r.settled)return this.touched;if(t>Gn&&!this.world.hasChunk(e,t-1,i))return this.touched;this.settling=r,this.settleSeed(r);let s=0;for(;this.queue.size>0&&s<QS;){const a=this.queue.values().next();if(a.done)break;const c=a.value,l=this.editQueue.has(c);this.queue.delete(c),this.editQueue.delete(c);const[u,f,d]=c.split(",").map(Number);this.process(u,f,d,l),s++}this.settling=null,r.settled=!0;const o=this.world.getChunk(e,t+1,i);return o&&!o.settled&&this.settle(e,t+1,i),this.touched}restore(e){const t=e.cx*16,i=e.cy*16,r=e.cz*16;for(let s=0;s<e.blocks.length;s++)e.blocks[s]!==Z.Water||e.wplaced[s]!==1||this.springs.add(`${t+(s&15)},${i+(s>>8&15)},${r+(s>>4&15)}`);if(e.cy>Gn&&!this.world.hasChunk(e.cx,e.cy-1,e.cz))for(let s=0;s<16;s++)for(let o=0;o<16;o++)e.blocks[ut(s,0,o)]===Z.Water&&this.waiting.set(`${t+s},${i},${r+o}`,!1);for(let s=0;s<16;s++)for(let o=0;o<16;o++)for(let a=0;a<16;a++)(s===0||s===15||o===0||o===15||a===0||a===15)&&e.blocks[ut(s,o,a)]===Z.Water&&this.remark(t+s,i+o,r+a,!1)}edit(e,t,i,r){if(!this.inBand(t))return;const s=this.world.getChunk(xe(e),xe(t),xe(i));if(!s)return;const o=ut(e-s.cx*16,t-s.cy*16,i-s.cz*16);r===Z.Water?(s.wlevel[o]=7,s.wsource[o]=1,s.wplaced[o]=1,this.springs.add(`${e},${t},${i}`)):(s.wlevel[o]=0,s.wsource[o]=0,s.wplaced[o]=0,this.springs.delete(`${e},${t},${i}`)),s.wstream[o]=0,this.remark(e,t,i,!0)}}const uf=240;class xu{constructor(e=0){B(this,"time",0);B(this,"phaseTotal");B(this,"tick",0);this.phaseTotal=e}get dayPhase(){return this.phaseTotal%1}get day(){return 1+Math.floor(this.phaseTotal+.5)}get hour(){return(12+24*this.dayPhase)%24}advance(e){this.time+=e,this.phaseTotal+=e/uf,this.tick++}advanceClock(e){this.time+=e,this.phaseTotal+=e/uf}slew(e){this.time=e.time,this.phaseTotal=e.phaseTotal}advanceTick(){this.tick++}snapshot(){return{time:this.time,tick:this.tick,phaseTotal:this.phaseTotal}}restore(e){this.time=e.time,this.tick=e.tick,this.phaseTotal=e.phaseTotal}}const df=n=>String(n).padStart(2,"0");function eM(n,e){const t=Math.floor(e)%24,i=Math.floor((e-t)*60+1e-9);return`Day ${n} · ${df(t)}:${df(i)}`}function tM(n,e,t){return Math.floor(e/t)>Math.floor(n/t)}function ze(n){return[parseInt(n.slice(1,3),16)/255,parseInt(n.slice(3,5),16)/255,parseInt(n.slice(5,7),16)/255]}const qo=[{p:0,top:ze("#3d9ae0"),horizon:ze("#87ceeb"),airFog:ze("#cfe8ff"),airFogDens:.004,dim:1,stars:0,waterBg:ze("#0a2a55"),waterFog:ze("#0a2a55"),waterFogDens:.35},{p:.22,top:ze("#6f8fc8"),horizon:ze("#e8a05c"),airFog:ze("#d8b8a8"),airFogDens:.0045,dim:1,stars:0,waterBg:ze("#09244d"),waterFog:ze("#0a2a55"),waterFogDens:.35},{p:.25,top:ze("#3a2f66"),horizon:ze("#d9713f"),airFog:ze("#6a5570"),airFogDens:.005,dim:.85,stars:.15,waterBg:ze("#071c3d"),waterFog:ze("#071c3d"),waterFogDens:.37},{p:.3,top:ze("#0a0d1e"),horizon:ze("#232c52"),airFog:ze("#151d3a"),airFogDens:.0055,dim:.45,stars:.6,waterBg:ze("#040b18"),waterFog:ze("#040b18"),waterFogDens:.39},{p:.5,top:ze("#05070f"),horizon:ze("#2a3a66"),airFog:ze("#101a33"),airFogDens:.006,dim:.33,stars:1,waterBg:ze("#030710"),waterFog:ze("#04091a"),waterFogDens:.4},{p:.7,top:ze("#0a0d1e"),horizon:ze("#232c52"),airFog:ze("#151d3a"),airFogDens:.0055,dim:.45,stars:.6,waterBg:ze("#040b18"),waterFog:ze("#040b18"),waterFogDens:.39},{p:.75,top:ze("#3a2f66"),horizon:ze("#d9713f"),airFog:ze("#6a5570"),airFogDens:.005,dim:.85,stars:.15,waterBg:ze("#071c3d"),waterFog:ze("#071c3d"),waterFogDens:.37},{p:.78,top:ze("#6f8fc8"),horizon:ze("#e8a05c"),airFog:ze("#d8b8a8"),airFogDens:.0045,dim:1,stars:0,waterBg:ze("#09244d"),waterFog:ze("#0a2a55"),waterFogDens:.35},{p:1,top:ze("#3d9ae0"),horizon:ze("#87ceeb"),airFog:ze("#cfe8ff"),airFogDens:.004,dim:1,stars:0,waterBg:ze("#0a2a55"),waterFog:ze("#0a2a55"),waterFogDens:.35}],Yi=(n,e,t)=>n+(e-n)*t,ps=(n,e,t)=>[Yi(n[0],e[0],t),Yi(n[1],e[1],t),Yi(n[2],e[2],t)],nM=n=>{const e=n<0?0:n>1?1:n;return e*e*(3-2*e)};function iM(n){const e=(n%1+1)%1;let t=0;for(let c=0;c<qo.length-1;c++)qo[c].p<=e&&(t=c);const i=qo[t],r=qo[t+1],s=nM((e-i.p)/(r.p-i.p)),o=[Math.sin(2*Math.PI*e),Math.cos(2*Math.PI*e),0],a=Yi(i.dim,r.dim,s);return{skyTop:ps(i.top,r.top,s),skyHorizon:ps(i.horizon,r.horizon,s),airFogColor:ps(i.airFog,r.airFog,s),airFogDensity:Yi(i.airFogDens,r.airFogDens,s),worldDim:a,dayness:(a-.33)/.67,starAlpha:Yi(i.stars,r.stars,s),sunDir:o,moonDir:[-o[0],-o[1],-o[2]],waterBg:ps(i.waterBg,r.waterBg,s),waterFogColor:ps(i.waterFog,r.waterFog,s),waterFogDensity:Yi(i.waterFogDens,r.waterFogDens,s)}}const rM=n=>{let e=n>>>0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}},ff=n=>`rgb(${Math.round(n[0]*255)},${Math.round(n[1]*255)},${Math.round(n[2]*255)})`,hf=(n,e)=>Math.abs(n[0]-e[0])+Math.abs(n[1]-e[1])+Math.abs(n[2]-e[2]);function sM(n,e,t,i){const r=document.createElement("canvas");r.width=16,r.height=256;const s=r.getContext("2d"),o=new $r(r),a=(b,E)=>{for(let A=0;A<128;A++){const C=A/127;s.fillStyle=ff([b[0]+(E[0]-b[0])*C,b[1]+(E[1]-b[1])*C,b[2]+(E[2]-b[2])*C]),s.fillRect(0,A,16,1)}s.fillStyle=ff(E),s.fillRect(0,128,16,128)},c=new Wt(new lu(400,32,16),new Ai({map:o,side:Bt,fog:!1,depthWrite:!1}));n.add(c);const l=400,u=new Float32Array(l*3),f=new Float32Array(l*3);{const b=rM(5351294);for(let E=0;E<l;E++){const A=b(),C=b()*Math.PI*2,w=Math.sqrt(1-A*A);u[E*3]=w*Math.cos(C)*360,u[E*3+1]=A*360,u[E*3+2]=w*Math.sin(C)*360;const x=b()<.3;f[E*3]=x?.72:1,f[E*3+1]=x?.78:1,f[E*3+2]=1}}const d=new Xt;d.setAttribute("position",new bt(u,3)),d.setAttribute("color",new bt(f,3));const p=new Hh({size:2,sizeAttenuation:!1,vertexColors:!0,transparent:!0,opacity:0,fog:!1,depthWrite:!1}),g=new Px(d,p);n.add(g);const _=(b,E,A)=>{const C=document.createElement("canvas");C.width=64,C.height=64;const w=C.getContext("2d"),x=w.createRadialGradient(32,32,0,32,32,32);return x.addColorStop(0,b),x.addColorStop(.25,b),x.addColorStop(.5,E),x.addColorStop(1,A),w.fillStyle=x,w.fillRect(0,0,64,64),new $r(C)},h=new Il(new Sa({map:_("rgba(255,246,205,1)","rgba(255,196,80,0.8)","rgba(255,150,40,0)"),fog:!1,transparent:!0}));h.scale.set(46,46,1),n.add(h);const m=new Il(new Sa({map:_("rgba(244,244,232,1)","rgba(190,198,228,0.7)","rgba(150,160,205,0)"),fog:!1,transparent:!0}));m.scale.set(34,34,1),n.add(m),g.renderOrder=-2,h.renderOrder=-2,m.renderOrder=-2;const v=new W;let y=null,S=null;return{apply(b,E,A){if(E==="water"){n.background=i,n.fog=t,i.setRGB(b.waterBg[0],b.waterBg[1],b.waterBg[2]),t.color.setRGB(b.waterFogColor[0],b.waterFogColor[1],b.waterFogColor[2]),t.density=b.waterFogDensity,c.visible=!1,g.visible=!1,h.visible=!1,m.visible=!1;return}n.background=null,n.fog=e,e.color.setRGB(b.airFogColor[0],b.airFogColor[1],b.airFogColor[2]),e.density=b.airFogDensity,c.visible=!0,c.position.copy(A.position),g.visible=b.starAlpha>.01,p.opacity=b.starAlpha,g.position.copy(A.position),h.position.copy(A.position).addScaledVector(v.set(b.sunDir[0],b.sunDir[1],b.sunDir[2]),380),h.visible=b.sunDir[1]>-.03,m.position.copy(A.position).addScaledVector(v.set(b.moonDir[0],b.moonDir[1],b.moonDir[2]),380),m.visible=b.moonDir[1]>-.03,(y===null||S===null||hf(b.skyTop,y)>.003||hf(b.skyHorizon,S)>.003)&&(a(b.skyTop,b.skyHorizon),o.needsUpdate=!0,y=[...b.skyTop],S=[...b.skyHorizon])}}}const Aa=4,ki=128,pf=12,oM=.2,aM=.05,np=96,Ra=2048,cM=.5,lM=.45,uM=37.7,dM=6033621;function fM(n){let e=n>>>0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}const hM=Xh(fM(dM));function pM(n,e,t=0,i=0){return hM((n+Aa/2+t)/pf,(e+Aa/2+i)/pf)}function mM(n,e){const t=pM(n*Aa,e*Aa);return t>oM?2:t>aM?1:0}function gM(n){return[cM*n,lM*n+uM]}function _M(n,e,t){const[i,r]=gM(t);return[(n+i)/Ra,(e+r)/Ra]}function vM(n){return n<=np?-1:1}function yM(n){const e=document.createElement("canvas");e.width=ki,e.height=ki;{const c=e.getContext("2d"),l=c.createImageData(ki,ki);for(let u=0;u<ki;u++)for(let f=0;f<ki;f++){const d=mM(f,u),p=(u*ki+f)*4;l.data[p]=255,l.data[p+1]=255,l.data[p+2]=255,l.data[p+3]=d===2?255:d===1?153:0}c.putImageData(l,0,0)}const t=new $r(e);t.wrapS=t.wrapT=pa,t.magFilter=Ct,t.minFilter=Ct,t.generateMipmaps=!1;const i=new Ai({map:t,transparent:!0,opacity:.7,depthWrite:!1,side:En,fog:!1}),r=new Zs(Ra,Ra);r.rotateX(-Math.PI/2);{const c=r.attributes.uv;for(let l=0;l<c.count;l++)c.setY(l,1-c.getY(l))}const s=new Wt(r,i);n.add(s);const o=new Ke(16777215),a=new Ke(7371420);return{update(c,l,u,f,d){s.position.set(c,np,l),s.renderOrder=vM(u);const[p,g]=_M(c,l,f);t.offset.set(p,g);const _=Math.max(0,Math.min(1,(1-d)/(1-.33)));i.color.copy(o).lerp(a,_)},setVisible(c){s.visible=c}}}const Bl=.12,xM=512;function SM(n,e,t){n.stats.pops=t.stats.pops,n.stats.seeds=t.stats.seeds,n.stats.fieldChanges=t.stats.fieldChanges,n.queue=t.queue,n.lastTick=t.tick;for(const i of t.changed){const r=e.getChunk(i.cx,i.cy,i.cz);r&&(r.blight.set(i.blight),r.skylight.set(i.skylight),n.touched.add(it(i.cx,i.cy,i.cz)))}}class zl{constructor(e,t){B(this,"touched",new Set);B(this,"stats",{pops:0,seeds:0,fieldChanges:0});B(this,"queue",0);B(this,"lastTick",0);B(this,"world");B(this,"worldTime");B(this,"worker");this.world=e,this.worldTime=t,this.worker=new Worker(new URL(""+new URL("light-worker-C1dnrZy_.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.onmessage=i=>SM(this,e,i.data),this.worker.onerror=i=>{console.error("[light-worker] worker crashed — light updates are frozen",i)}}load(e,t,i){const r=this.world.getChunk(e,t,i);r&&this.worker.postMessage({t:"load",tick:this.worldTime.tick,cx:e,cy:t,cz:i,blocks:r.blocks.slice(),meta:r.meta.slice()})}unload(e,t,i){this.worker.postMessage({t:"unload",tick:this.worldTime.tick,cx:e,cy:t,cz:i})}edit(e,t,i){this.worker.postMessage({t:"edit",tick:this.worldTime.tick,x:e,y:t,z:i,block:this.world.getBlock(e,t,i),meta:this.world.getMeta(e,t,i)})}tick(e){this.worker.postMessage({t:"tick",tick:this.worldTime.tick,budget:e})}}class MM{constructor(e="block-world",t=2){B(this,"dbp");this.dbp=new Promise((i,r)=>{const s=indexedDB.open(e,t);s.onupgradeneeded=()=>{s.result.objectStoreNames.contains("chunks")||s.result.createObjectStore("chunks"),s.result.objectStoreNames.contains("replays")||s.result.createObjectStore("replays")},s.onsuccess=()=>i(s.result),s.onerror=()=>r(s.error)})}tx(e,t){return this.dbp.then(i=>new Promise((r,s)=>{const o=i.transaction("chunks",e),a=t(o.objectStore("chunks"));a.onsuccess=()=>r(a.result),a.onerror=()=>s(a.error)}))}async get(e){return await this.tx("readonly",i=>i.get(e))??void 0}async put(e,t){await this.tx("readwrite",i=>i.put(t,e))}async putMany(e){e.length!==0&&await this.dbp.then(t=>new Promise((i,r)=>{const s=t.transaction("chunks","readwrite"),o=s.objectStore("chunks");s.oncomplete=()=>i(),s.onerror=()=>r(s.error),s.onabort=()=>r(s.error??new Error("transaction aborted"));try{for(const[a,c]of e)o.put(c,a)}catch(a){s.abort(),r(a)}}))}async delete(e){await this.tx("readwrite",t=>t.delete(e))}async keys(e){return this.tx("readonly",t=>t.getAllKeys(e?IDBKeyRange.bound(e,e+"￿"):void 0))}txReplay(e,t){return this.dbp.then(i=>new Promise((r,s)=>{const o=i.transaction("replays",e),a=t(o.objectStore("replays"));a.onsuccess=()=>r(a.result),a.onerror=()=>s(a.error)}))}async putReplay(e,t){await this.txReplay("readwrite",i=>i.put(t,e))}async getReplay(e){return await this.txReplay("readonly",i=>i.get(e))??void 0}async listReplays(){return this.txReplay("readonly",e=>e.getAll())}}function ip(n,e){return n?n.forward===e.forward&&n.strafe===e.strafe&&n.up===e.up&&n.down===e.down&&n.yaw===e.yaw&&n.pitch===e.pitch&&n.primary===e.primary&&n.secondary===e.secondary&&(n.select??-1)===(e.select??-1)&&(n.block??-1)===(e.block??-1)&&(n.toggleFly??!1)===(e.toggleFly??!1)&&(n.toggleNoclip??!1)===(e.toggleNoclip??!1):!1}class rp{constructor(e){B(this,"events",[]);B(this,"intents",[]);B(this,"viewed",[]);B(this,"last",new Map);B(this,"lastTick");B(this,"onIntent");this.lastTick=e,this.onIntent=(t,i,r)=>{this.lastTick=t;const s=this.last.get(i.id);ip(s,r)||(this.intents.push({tick:t,entityId:i.id,intent:{...r}}),this.last.set(i.id,r))}}onViewed(e,t){this.viewed.push({tick:e,id:t})}attach(e){e.onIntent=this.onIntent,e.onSpawn=t=>this.events.push({tick:this.lastTick,type:"spawn",id:t.id,kindId:t.kind.id,pose:e.toRecord(t)}),e.onDespawn=t=>this.events.push({tick:this.lastTick,type:"despawn",id:t.id})}}class EM{constructor(e){B(this,"idx",0);B(this,"last",null);this.entries=e}intent(e,t){for(;this.idx<this.entries.length&&this.entries[this.idx].tick<=t;)this.last=this.entries[this.idx].intent,this.idx++;return this.last?{...this.last}:{...nr}}}function wM(n){return new URLSearchParams(n).get("replay")}function bM(n,e){let t=n.snapshot.meta.viewedEntityId;for(const i of n.viewed??[])if(i.tick<=e)t=i.id;else break;return t}class TM{constructor(e){B(this,"selfId");B(this,"hub");B(this,"msgCb",()=>{});B(this,"joinCb",()=>{});B(this,"leaveCb",()=>{});B(this,"peerList",[]);this.selfId=e}peers(){return[...this.peerList]}send(e,t){this.hub.route(this.selfId,e,t)}onMessage(e){this.msgCb=e}onPeerJoin(e){this.joinCb=e}onPeerLeave(e){this.leaveCb=e}disconnect(){this.hub.disconnect(this.selfId)}fire(e,t){this.msgCb(e,t)}addPeer(e){this.peerList.push(e),this.joinCb(e)}removePeer(e){this.peerList=this.peerList.filter(t=>t!==e),this.leaveCb(e)}}class AM{constructor(e={}){B(this,"transports",new Map);B(this,"tick",0);B(this,"sentCount",0);B(this,"sentBytes",0);B(this,"delay");B(this,"maxJitter");B(this,"rng");B(this,"links",new Map);this.delay=e.delay??(()=>0),this.maxJitter=e.jitterTicks??0,this.rng=new Ga(e.seed??1234)}connect(e){const t=new TM(e);t.hub=this,this.transports.set(e,t);for(const[i,r]of this.transports)i!==e&&(r.addPeer(e),t.addPeer(i));return t}disconnect(e){if(this.transports.get(e)){for(const i of this.transports.values())i.selfId!==e&&i.removePeer(e);this.transports.delete(e)}}route(e,t,i){const r=t==="all"?[...this.transports.values()].filter(s=>s.selfId!==e):[this.transports.get(t)].filter(s=>!!s);for(const s of r){const o=this.maxJitter>0?Math.floor(this.rng.next()*(this.maxJitter+1)):0,a=`${e}\0${s.selfId}`,c=this.links.get(a)??{to:s.selfId,q:[]};c.q.push({from:e,at:this.tick+this.delay(e,s.selfId)+o,msg:i}),this.links.set(a,c),this.sentCount++,this.sentBytes+=JSON.stringify(i).length}}pump(e){var t;for(const{to:i,q:r}of this.links.values())for(;r.length&&r[0].at<=e;){const s=r.shift();(t=this.transports.get(i))==null||t.fire(s.from,s.msg)}}}const Ca=1,sp=3,RM=512,CM=1,PM=60,LM=6,IM=120,op=["blocks","meta","wlevel","wsource","wplaced","wstream"];function DM(n){let e="";for(let t=0;t<n.length;t++)e+=String.fromCharCode(n[t]);return btoa(e)}function UM(n){const e=atob(n),t=new Uint8Array(e.length);for(let i=0;i<e.length;i++)t[i]=e.charCodeAt(i);return t}function mf(n){if(!n)return null;const e={v:n.v,cx:n.cx,cy:n.cy,cz:n.cz};for(const t of op)e[t]=DM(n[t]);return n.entities&&(e.entities=n.entities),e}function gf(n){if(!n)return null;const e={v:n.v,cx:n.cx,cy:n.cy,cz:n.cz};for(const t of op)e[t]=UM(n[t]);return n.entities&&(e.entities=n.entities),e}function NM(n){return n.type==="welcome"?JSON.stringify({...n,snapshot:{chunks:n.snapshot.chunks.map(mf),meta:n.snapshot.meta}}):n.type==="chunkRec"?JSON.stringify({...n,rec:mf(n.rec)}):JSON.stringify(n)}function FM(n){const e=JSON.parse(n);if(e.type==="welcome"){const t=e.snapshot;e.snapshot={chunks:t.chunks.map(i=>gf(i)),meta:t.meta}}else e.type==="chunkRec"&&(e.rec=gf(e.rec));return e}class kM{constructor(e){B(this,"last",null);this.peerId=e}setIntent(e){this.last={...e}}intent(e,t){return this.last?{...this.last}:{...nr}}}const _f=1/60,OM=30,BM=1e3;class Uc{constructor(e,t,i={}){B(this,"world",new fu);B(this,"waterSim");B(this,"sim");B(this,"persist");B(this,"recorder");B(this,"spawn");B(this,"meshable",new Set);B(this,"lastStream",null);B(this,"worldTime",new xu);B(this,"transport");B(this,"seed");B(this,"peers",new Map);B(this,"pendingCells",new Map);B(this,"syncedSettled",new Set);this.transport=e,this.seed=t,this.waterSim=new tp(this.world),this.persist=i.persist??new Nl(new Vx,t),this.sim=new yu(this.world,i.hooks??{},t),this.recorder=new rp(0),this.recorder.attach(this.sim);const r=new hu(Gt);for(let o=Cs;o<=Ta;o++)pu(this.world,r,0,o,2);this.waterSim.settle(0,Cs,2);let s=79;for(;s>0&&!this.isOpaque(this.world.getBlock(6,s,46));)s--;if(this.spawn={x:6.5,y:s+1,z:46.5},this.sim.respawn={...this.spawn},i.withOwnPlayer!==!1){const o=this.sim.spawn(this.spawn,i.ownController??new jt,{yaw:-Math.PI/2,kindId:"player",baseController:new jt});i.ownName&&(o.name=i.ownName),this.sim.setViewed(o.id),this.sim.homeId=o.id}this.world.onCellWrite=(o,a,c)=>{const l=this.world.readCell(o,a,c);if(!l)return;const u=it(l.cx,l.cy,l.cz);let f=this.pendingCells.get(u);f||(f=new Map,this.pendingCells.set(u,f)),f.set(l.idx,[l.idx,l.block,l.meta,l.l,l.s,l.p,l.st])},this.sim.onSpawn=o=>{this.broadcast({type:"spawn",tick:this.worldTime.tick,id:o.id,kindId:o.kind.id,pose:this.sim.toRecord(o)})},this.sim.onDespawn=o=>{this.broadcast({type:"despawn",tick:this.worldTime.tick,id:o.id})},this.transport.onMessage((o,a)=>this.onMessage(o,a)),this.transport.onPeerLeave(o=>this.onPeerLeave(o))}isOpaque(e){return e!==Z.Air&&e!==Z.Torch}onMessage(e,t){var i;switch(t.type){case"hello":this.onHello(e,t.name,t.protocol);break;case"intent":{const r=this.peers.get(e);r&&r.controller.setIntent(t.intent);break}case"chunkReq":this.onChunkReq(e,t.key);break;case"chunkLoaded":{const r=this.peers.get(e);if(!r)break;r.loaded.add(t.key);const[s,o,a]=t.key.split(",").map(Number),c=this.world.getChunk(s,o,a);c&&this.transport.send(e,{type:"chunkRec",key:t.key,rec:hi(c,this.sim.entitiesInChunk(s,o,a).map(l=>this.sim.toRecord(l)))});break}case"chunkUnloaded":(i=this.peers.get(e))==null||i.loaded.delete(t.key);break}}onHello(e,t,i){var c,l;if(i!==Ca){console.warn(`[host] refusing ${t}: protocol ${i} != ${Ca}`);return}const r=this.peers.get(e);if(r){this.transport.send(e,{type:"welcome",seed:this.seed,tick:this.worldTime.tick,worldTime:this.worldTime.snapshot(),yourEntityId:r.entityId,snapshot:this.welcomeSnapshot()});return}let s=0;const o=new kM(e),a=(l=(c=this.persist.meta)==null?void 0:c.peers)==null?void 0:l[t];if(a){this.sim.restoreEntity(a,o),s=a.id;const u=this.sim.entities.get(s);u&&(u.name=t),this.peers.set(e,{name:t,entityId:s,controller:o,loaded:new Set})}else{const u=this.sim.spawn(this.spawn,o,{yaw:-Math.PI/2,kindId:"player",baseController:o});u.name=t,s=u.id,this.peers.set(e,{name:t,entityId:s,controller:o,loaded:new Set})}this.transport.send(e,{type:"welcome",seed:this.seed,tick:this.worldTime.tick,worldTime:this.worldTime.snapshot(),yourEntityId:s,snapshot:this.welcomeSnapshot()})}welcomeSnapshot(){const e=xe(this.spawn.x),t=xe(this.spawn.z),i=[];for(let r=-Sn;r<=Sn;r++)for(let s=-Sn;s<=Sn;s++)for(let o=Cs;o<=Ta;o++){const a=this.world.getChunk(e+r,o,t+s);a&&i.push(hi(a,this.sim.entitiesInChunk(a.cx,a.cy,a.cz).map(c=>this.sim.toRecord(c))))}return{chunks:i,meta:this.metaSnapshot()}}metaSnapshot(){var e;return{v:2,seed:this.seed,entities:this.sim.all().map(t=>this.sim.toRecord(t)),viewedEntityId:this.sim.viewedId,simPrng:this.sim.rng.state(),time:this.worldTime.snapshot(),hotbar:{slots:[1,2,3,4,5,6,7,8,9],selected:0},peers:(e=this.persist.meta)==null?void 0:e.peers}}onChunkReq(e,t){const[i,r,s]=t.split(",").map(Number),o=this.world.getChunk(i,r,s);if(o){this.transport.send(e,{type:"chunkRec",key:t,rec:hi(o,this.sim.entitiesInChunk(i,r,s).map(c=>this.sim.toRecord(c)))});return}const a=this.persist.syncRecord(i,r,s);if(a){this.transport.send(e,{type:"chunkRec",key:t,rec:a});return}this.transport.send(e,{type:"chunkRec",key:t,rec:null})}onPeerLeave(e){const t=this.peers.get(e);if(!t)return;const i=this.sim.entities.get(t.entityId),r=i?this.sim.toRecord(i):void 0;i&&this.sim.despawn(t.entityId),this.persist.meta||(this.persist.meta={v:2,seed:this.seed,entities:[],viewedEntityId:this.sim.viewedId,time:this.worldTime.snapshot(),hotbar:{slots:[1,2,3,4,5,6,7,8,9],selected:0}}),r&&(this.persist.meta.peers={...this.persist.meta.peers??{},[t.name]:r}),this.persist.saveMeta(this.metaSnapshot()),this.peers.delete(e)}anchors(){const e=[],t=this.sim.viewed();t&&e.push({cx:xe(t.pos.x),cz:xe(t.pos.z),cy:xe(t.pos.y),radius:Sn,meshable:!0});for(const i of this.peers.values()){const r=this.sim.entities.get(i.entityId);r&&e.push({cx:xe(r.pos.x),cz:xe(r.pos.z),cy:xe(r.pos.y),radius:CM,meshable:!1})}return e}flushCells(){if(this.pendingCells.size===0)return;const e=this.pendingCells;this.pendingCells=new Map;for(const[t,i]of e){const r=[...i.values()];for(const[s,o]of this.peers)if(o.loaded.has(t))if(r.length>RM){const[a,c,l]=t.split(",").map(Number),u=this.world.getChunk(a,c,l);u&&this.transport.send(s,{type:"chunkRec",key:t,rec:hi(u,this.sim.entitiesInChunk(a,c,l).map(f=>this.sim.toRecord(f)))})}else this.transport.send(s,{type:"cells",tick:this.worldTime.tick,chunk:t,writes:r})}}broadcastState(){for(const[e,t]of this.peers){const i=this.sim.entities.get(t.entityId);if(!i)continue;const r=xe(i.pos.x),s=xe(i.pos.z),o=[];for(const a of this.sim.all())Math.abs(xe(a.pos.x)-r)>Sn||Math.abs(xe(a.pos.z)-s)>Sn||o.push({id:a.id,kindId:a.kind.id,name:a.name,x:a.pos.x,y:a.pos.y,z:a.pos.z,yaw:a.yaw,pitch:a.pitch,vx:a.vel.x,vy:a.vel.y,vz:a.vel.z,flags:(a.inWater?1:0)|(a.onGround?2:0)});this.transport.send(e,{type:"state",tick:this.worldTime.tick,entities:o})}}broadcast(e){this.transport.send("all",e)}tick(e){this.sim.tick(_f,e),e%OM===0&&this.waterSim.tick(BM),this.worldTime.advanceClock(_f),this.flushCells();const t=this.anchors();if(t.length){const i=mu(this.world,t,this.persist,this.sim);this.meshable=i.meshable,this.lastStream=i;for(const r of i.rebuilt)this.waterSim.settle(r.cx,r.cy,r.cz);for(const r of i.unloaded)this.syncedSettled.delete(it(r.cx,r.cy,r.cz))}else this.lastStream=null;e%sp===0&&this.broadcastState(),e%PM===0&&this.broadcast({type:"time",tick:this.worldTime.tick,worldTime:this.worldTime.snapshot()}),this.pushSettledChunks()}pushSettledChunks(){for(const e of this.world.allChunks()){const t=it(e.cx,e.cy,e.cz);if(!e.settled||this.syncedSettled.has(t))continue;this.syncedSettled.add(t);let i=!1;for(const[,s]of this.peers)if(s.loaded.has(t)){i=!0;break}if(!i)continue;const r=hi(e,this.sim.entitiesInChunk(e.cx,e.cy,e.cz).map(s=>this.sim.toRecord(s)));for(const[s,o]of this.peers)o.loaded.has(t)&&this.transport.send(s,{type:"chunkRec",key:t,rec:r})}}}class zM{constructor(e){B(this,"pending",new Map);this.transport=e}hasPersisted(){return!1}syncRecord(){}fetchRecord(e,t,i){const r=`${e},${t},${i}`;return new Promise(s=>{this.pending.set(r,o=>s(o??void 0)),this.transport.send("all",{type:"chunkReq",key:r})})}resolveChunk(e,t){const i=this.pending.get(e);i&&(this.pending.delete(e),i(t))}onUnload(){}dropPersisted(){}}const HM=8;class GM{constructor(e=HM){B(this,"buf",[]);this.n=e}push(e){this.buf.push(e),this.buf.length>this.n&&this.buf.shift()}get samples(){return this.buf}clear(){this.buf=[]}}function VM(n,e,t){let i=(e-n)%(Math.PI*2);i>Math.PI&&(i-=Math.PI*2),i<-Math.PI&&(i+=Math.PI*2);let r=n+i*t;return r=(r+Math.PI)%(Math.PI*2),r<0&&(r+=Math.PI*2),r-Math.PI}const $o=(n,e,t)=>n+(e-n)*t;function WM(n,e){if(n.length===0)return{tick:e,x:0,y:0,z:0,yaw:0,pitch:0};if(n.length===1||e<=n[0].tick)return n[0];const t=n[n.length-1];if(e>=t.tick)return t;for(let i=1;i<n.length;i++){const r=n[i];if(r.tick>=e){const s=n[i-1];if(r.tick===s.tick)return r;if(r.tick-s.tick>sp)return s;const o=(e-s.tick)/(r.tick-s.tick);return{tick:e,x:$o(s.x,r.x,o),y:$o(s.y,r.y,o),z:$o(s.z,r.z,o),yaw:VM(s.yaw,r.yaw,o),pitch:$o(s.pitch,r.pitch,o)}}}return t}const vf=1/60,Yo={intent:()=>({...nr})};class gi{constructor(e,t,i){B(this,"world",new fu);B(this,"sim");B(this,"persist");B(this,"controller");B(this,"worldTime",new xu);B(this,"transport");B(this,"name","");B(this,"entityId",-1);B(this,"lastStream",null);B(this,"rings",new Map);B(this,"lightEdit",null);B(this,"own",{x:0,y:0,z:0,yaw:0,pitch:0});B(this,"lastIntent");B(this,"joined",!1);B(this,"tick_",0);B(this,"predicted",new Map);B(this,"lastSnap",0);B(this,"hostId","");B(this,"handlers",new Map);this.transport=e,this.name=t,this.controller=i,this.sim=new yu(this.world,{},1234),this.persist=new zM(e),e.onMessage((r,s)=>{if(s.type==="chunkRec"){this.applyChunkRec(s.key,s.rec);return}s.type==="welcome"&&!this.hostId&&(this.hostId=r),this.onMessage(s)}),e.send("all",{type:"hello",name:t,protocol:Ca}),e.onPeerJoin(r=>{this.joined||e.send("all",{type:"hello",name:this.name,protocol:Ca})})}on(e,t){const i=this.handlers.get(e)??[];i.push(t),this.handlers.set(e,i)}fire(e){for(const t of this.handlers.get(e)??[])t()}setLightEdit(e){this.lightEdit=e}onPeerLeave(e){this.transport.onPeerLeave(e)}parse(e){const[t,i,r]=e.split(",").map(Number);return[t,i,r]}onMessage(e){switch(e.type){case"welcome":{this.entityId=e.yourEntityId,this.joined=!0,this.worldTime.slew(e.worldTime),this.worldTime.tick=e.tick;for(const t of e.snapshot.chunks)Yr(this.world,t,this.sim,()=>Yo),this.transport.send("all",{type:"chunkLoaded",key:it(t.cx,t.cy,t.cz)});for(const t of e.snapshot.meta.entities)this.sim.restoreEntity(t,Yo);this.sim.setViewed(this.entityId),this.sim.entities.has(this.entityId)&&(this.sim.homeId=this.entityId),this.fire("welcome");break}case"state":for(const t of e.entities){if(t.id===this.entityId){this.own={x:t.x,y:t.y,z:t.z,yaw:t.yaw,pitch:t.pitch},this.reconcile(t,e.tick);continue}let i=this.rings.get(t.id);i||(i=new GM,this.rings.set(t.id,i)),i.push({tick:e.tick,x:t.x,y:t.y,z:t.z,yaw:t.yaw,pitch:t.pitch});const r=this.sim.entities.get(t.id);r&&(r.pos={x:t.x,y:t.y,z:t.z},r.yaw=t.yaw,r.pitch=t.pitch,t.name&&(r.name=t.name))}break;case"cells":this.applyCells(e.chunk,e.writes);break;case"spawn":this.sim.restoreEntity(e.pose,Yo);break;case"despawn":this.sim.despawn(e.id),this.rings.delete(e.id);break;case"time":this.worldTime.slew(e.worldTime);break}}reconcile(e,t){const i=this.sim.entities.get(this.entityId);if(!i)return;const r={x:i.pos.x,y:i.pos.y,z:i.pos.z};i.pos={x:e.x,y:e.y,z:e.z},i.yaw=e.yaw,i.pitch=e.pitch,i.vel={x:e.vx,y:e.vy,z:e.vz},i.inWater=(e.flags&1)!==0,i.onGround=(e.flags&2)!==0;for(let s=t+1;s<=this.tick_;s++){const o=this.predicted.get(s);o&&kl(this.world,i,o,vf)}this.lastSnap=Math.hypot(i.pos.x-r.x,i.pos.y-r.y,i.pos.z-r.z)}applyCells(e,t){const[i,r,s]=this.parse(e),o=this.world.getChunk(i,r,s);if(o){for(const[a,c,l,u,f,d,p]of t)if(o.blocks[a]=c,o.meta[a]=l,o.wlevel[a]=u,o.wsource[a]=f,o.wplaced[a]=d,o.wstream[a]=p,this.lightEdit){const g=a%16,_=(a/16|0)%16,h=(a/256|0)%16;this.lightEdit(i*16+g,r*16+h,s*16+_)}}}applyChunkRec(e,t){if(!t){this.persist.resolveChunk(e,null);return}const[i,r,s]=this.parse(e);if(!this.world.hasChunk(i,r,s))return;Yr(this.world,t,this.sim,()=>Yo);const o=this.world.getChunk(i,r,s);o&&(o.dirty=!0),this.persist.resolveChunk(e,t)}tick(e){this.tick_=e;const t=this.sim.viewed();if(t){const s=this.controller.intent(t,e);if(this.predicted.set(e,s),this.predicted.size>IM){const o=Math.min(...this.predicted.keys());this.predicted.delete(o)}ip(this.lastIntent,s)||(this.lastIntent={...s},this.joined&&this.transport.send("all",{type:"intent",tick:e,intent:s})),this.joined&&kl(this.world,t,s,vf)}const i={cx:xe(t?t.pos.x:this.own.x),cz:xe(t?t.pos.z:this.own.z),cy:2,radius:Sn,meshable:!0},r=mu(this.world,[i],this.persist,this.sim);this.lastStream=r;for(const s of r.generated)this.transport.send("all",{type:"chunkLoaded",key:it(s.cx,s.cy,s.cz)});for(const s of r.unloaded)this.transport.send("all",{type:"chunkUnloaded",key:it(s.cx,s.cy,s.cz)})}syncPoses(){const e=this.worldTime.tick-LM;for(const[t,i]of this.rings){if(t===this.entityId)continue;const r=this.sim.entities.get(t);if(!r)continue;const s=WM(i.samples,e);r.pos={x:s.x,y:s.y,z:s.z},r.yaw=s.yaw,r.pitch=s.pitch}}disconnect(){this.transport.disconnect()}}const yf=["Blue","Red","Green","Orange","Purple","Indigo","Gold","Crimson","Amber","Coral","Teal","Mint","Slate","Ivory","Ruby","Lime","Aqua","Scarlet","Sapphire","Topaz"];function XM(){return yf[Math.floor(Math.random()*yf.length)]+String(1e3+Math.floor(Math.random()*9e3))}function qM(n){const e=n.trim().replace(/\s+/g," ").slice(0,16).trim();return e===""?XM():e}/*! noble-secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) */const Su=Object.freeze,Si=0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn,eo=0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,ap=0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,cp=0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,$M=Su({p:Si,n:eo,h:1n,a:0n,b:7n,Gx:ap,Gy:cp}),Tn=32,xf=n=>n instanceof Uint8Array||ArrayBuffer.isView(n)&&n.constructor.name==="Uint8Array"&&n.BYTES_PER_ELEMENT===1,dn=(n,e,t="")=>{if(xf(n)&&(e===void 0||n.length===e))return n;const i=xf(n),r=e!==void 0?` of length ${e}`:"",s=i?`length=${n.length}`:`type=${typeof n}`,o=(t?`"${t}" `:"")+"expected Uint8Array"+r+", got "+s;throw i?new RangeError(o):new TypeError(o)},YM=n=>Uint8Array.from(n),KM=(n,e,t)=>YM(dn(n,t,e)),lp=(n,e)=>n.toString(16).padStart(e,"0"),up=n=>{let e="";for(const t of dn(n))e+=lp(t,2);return e},dp=n=>{const e="hex invalid";if(typeof n!="string")throw new TypeError(e);if(n.length%2||!/^[\da-f]*$/i.test(n))throw new RangeError(e);const t=new Uint8Array(n.length/2);for(let i=0,r=0;i<t.length;i++,r+=2){const s=n.charCodeAt(r),o=n.charCodeAt(r+1);t[i]=((s&15)+(s>>6)*9)*16+(o&15)+(o>>6)*9}return t},Sf=()=>{var e;const n=(e=globalThis==null?void 0:globalThis.crypto)==null?void 0:e.subtle;if(n)return n;throw new Error("crypto.subtle must be defined, consider polyfill")},Kr=(...n)=>{let e=0;for(const r of n)e+=dn(r).length;const t=new Uint8Array(e);let i=0;for(const r of n)t.set(r,i),i+=r.length;return t},Mu=(n=Tn)=>{const e=globalThis==null?void 0:globalThis.crypto;if(typeof(e==null?void 0:e.getRandomValues)!="function")throw new Error("crypto.getRandomValues must be defined, consider polyfill");return e.getRandomValues(new Uint8Array(n))},jM=BigInt,to=(n,e,t,i="bad number: out of range")=>{if(typeof n!="bigint")throw new TypeError(i);if(e<=n&&n<t)return n;throw new RangeError(i)},Ae=(n,e=Si)=>(n%=e)>=0n?n:e+n,Wa=n=>Ae(n,eo),ZM=(n,e)=>{if(n===0n)throw new Error("invert: expected non-zero number");if(e<=1n)throw new Error("invert: expected modulus > 1, got "+e);let t=Ae(n,e),i=e,r=0n,s=1n;for(;t!==0n;){const a=i/t,c=i-t*a,l=r-s*a;i=t,t=c,r=s,s=l}if(i!==1n)throw new Error("invert: does not exist");return Ae(r,e)},fp=n=>{const e=tE[n];if(typeof e!="function")throw new Error("hashes."+n+" not set");return e},Mf=(n,e,t)=>dn(fp(n)(e,t),Tn,"digest"),Ef=async(n,e,t)=>dn(await fp(n)(e,t),Tn,"digest"),Nc=n=>{if(n instanceof bi)return n;throw new TypeError("Point expected")},Fc="bad point: not on curve",hp=n=>Ae(Ae(n*n)*n+7n),wf=n=>to(n,0n,Si),Ls=n=>to(n,1n,Si),pp=n=>to(n,1n,eo),Xa=n=>!(n&1n),JM=n=>Uint8Array.of(Xa(n)?2:3),mp=n=>{const e=hp(Ls(n));let t=1n;for(let i=e,r=(Si+1n)/4n;r>0n;r>>=1n)r&1n&&(t=t*i%Si),i=i*i%Si;if(Ae(t*t)!==e)throw new Error("sqrt invalid");return new bi(n,Xa(t)?t:Ae(-t),1n)},Xn=class Xn{constructor(e,t,i){B(this,"X");B(this,"Y");B(this,"Z");this.X=wf(e),this.Y=Ls(t),this.Z=wf(i),Su(this)}static CURVE(){return $M}static fromAffine(e){const{x:t,y:i}=e;return t===0n&&i===0n?Is:new Xn(t,i,1n)}static fromBytes(e){dn(e);const t=e.length,i=e[0],r=Pa(e,1,33);try{if(t===33&&(i===2||i===3)){const s=mp(r);return i===3?s.negate():s}if(t===65&&i===4)return new Xn(r,Pa(e,33,65),1n).assertValidity()}catch{throw new Error(Fc)}throw new Error(Fc)}static fromHex(e){return Xn.fromBytes(dp(e))}get x(){return this.toAffine().x}get y(){return this.toAffine().y}equals(e){const{X:t,Y:i,Z:r}=this,{X:s,Y:o,Z:a}=Nc(e);return Ae(t*a)===Ae(s*r)&&Ae(i*a)===Ae(o*r)}is0(){return this.Z===0n}negate(){return new Xn(this.X,Ae(-this.Y),this.Z)}double(){return this.add(this)}add(e){const{X:t,Y:i,Z:r}=this,{X:s,Y:o,Z:a}=Nc(e),c=0n,l=7n;let u=0n,f=0n,d=0n;const p=Ae(l*3n);let g=Ae(t*s),_=Ae(i*o),h=Ae(r*a),m=Ae(t+i),v=Ae(s+o);m=Ae(m*v),v=Ae(g+_),m=Ae(m-v),v=Ae(t+r);let y=Ae(s+a);return v=Ae(v*y),y=Ae(g+h),v=Ae(v-y),y=Ae(i+r),u=Ae(o+a),y=Ae(y*u),u=Ae(_+h),y=Ae(y-u),d=Ae(c*v),u=Ae(p*h),d=Ae(u+d),u=Ae(_-d),d=Ae(_+d),f=Ae(u*d),_=Ae(g+g),_=Ae(_+g),h=Ae(c*h),v=Ae(p*v),_=Ae(_+h),h=Ae(g-h),h=Ae(c*h),v=Ae(v+h),g=Ae(_*v),f=Ae(f+g),g=Ae(y*v),u=Ae(m*u),u=Ae(u-g),g=Ae(m*_),d=Ae(y*d),d=Ae(d+g),new Xn(u,f,d)}subtract(e){return this.add(Nc(e).negate())}multiply(e,t=!0){if(!t&&e===0n)return Is;if(pp(e),e===1n)return this;if(this.equals(ir))return lE(e).p;let i=Is,r=ir,s=this;for(let o=0;t?o<256:e>0n;o++)e&1n?i=i.add(s):t&&(r=r.add(s)),s=s.double(),e>>=1n;return i}multiplyUnsafe(e){return this.multiply(e,!1)}toAffine(){const{X:e,Y:t,Z:i}=this;if(i===0n)return{x:0n,y:0n};if(i===1n)return{x:e,y:t};const r=ZM(i,Si);if(Ae(i*r)!==1n)throw new Error("inverse invalid");return{x:Ae(e*r),y:Ae(t*r)}}assertValidity(){const{x:e,y:t}=this.toAffine();if(Ls(e),Ls(t),Ae(t*t)!==hp(e))throw new Error(Fc);return this}toBytes(e=!0){const{x:t,y:i}=this.assertValidity().toAffine(),r=ti(t);return e?Kr(JM(i),r):Kr(Uint8Array.of(4),r,ti(i))}toHex(e){return up(this.toBytes(e))}};B(Xn,"BASE"),B(Xn,"ZERO");let bi=Xn;const ir=new bi(ap,cp,1n),Is=new bi(0n,1n,0n);bi.BASE=ir;bi.ZERO=Is;const QM=(n,e,t)=>ir.multiply(e,!1).add(n.multiply(t,!1)).assertValidity(),or=n=>jM("0x"+(up(n)||"0")),Pa=(n,e,t)=>or(n.subarray(e,t)),ti=n=>dp(lp(to(n,0n,2n**256n),Tn*2)),eE=n=>{const e=or(dn(n,Tn,"secret key"));return to(e,1n,eo,"invalid secret key: outside of range")},bf="SHA-256",tE={hmacSha256Async:async(n,e)=>{const t=Sf(),i=await t.importKey("raw",n,{name:"HMAC",hash:bf},!1,["sign"]);return new Uint8Array(await t.sign("HMAC",i,e))},hmacSha256:void 0,sha256Async:async n=>new Uint8Array(await Sf().digest(bf,n)),sha256:void 0},nE=n=>{if(n=n===void 0?Mu(48):n,dn(n),n.length<48||n.length>1024)throw new RangeError("expected 48-1024b");const e=Ae(or(n),eo-1n);return ti(e+1n)},iE=n=>e=>{const t=nE(e);return{secretKey:t,publicKey:n(t)}},gp=n=>Uint8Array.from("BIP0340/"+n,e=>e.charCodeAt(0)),Hl=(n,...e)=>{const t=Mf("sha256",gp(n));return Mf("sha256",Kr(t,t,...e))},Gl=(n,...e)=>Ef("sha256Async",gp(n)).then(t=>Ef("sha256Async",Kr(t,t,...e))),Eu=n=>{const e=eE(n),t=ir.multiply(e),{x:i,y:r}=t.assertValidity().toAffine(),s=Xa(r)?e:Wa(-e),o=ti(i);return{d:s,px:o}},wu=n=>Wa(or(n)),_p=(...n)=>wu(Hl("challenge",...n)),vp=async(...n)=>wu(await Gl("challenge",...n)),yp=n=>Eu(n).px,rE=iE(yp),xp=(n,e,t)=>{const i=KM(n,"message"),{px:r,d:s}=Eu(e);return{m:i,px:r,d:s,a:dn(t,Tn)}},Sp=n=>{const e=wu(n);if(e===0n)throw new Error("sign failed: k is zero");const{px:t,d:i}=Eu(ti(e));return{rx:t,k:i}},Mp=(n,e,t,i)=>Kr(e,ti(Wa(n+t*i))),Ep="invalid signature produced",sE=(n,e,t=Mu(Tn))=>{const{m:i,px:r,d:s,a:o}=xp(n,e,t),a=ti(s^or(Hl("aux",o))),{rx:c,k:l}=Sp(Hl("nonce",a,r,i)),u=Mp(l,c,_p(c,r,i),s);if(!bp(u,i,r))throw new Error(Ep);return u},oE=async(n,e,t=Mu(Tn))=>{const{m:i,px:r,d:s,a:o}=xp(n,e,t),a=ti(s^or(await Gl("aux",o))),{rx:c,k:l}=Sp(await Gl("nonce",a,r,i)),u=Mp(l,c,await vp(c,r,i),s);if(!await Tp(u,i,r))throw new Error(Ep);return u},aE=(n,e)=>n instanceof Promise?n.then(e):e(n),wp=(n,e,t,i)=>{const r=dn(n,64,"signature"),s=dn(e,void 0,"message"),o=dn(t,Tn,"publicKey");let a,c,l,u;try{const f=or(o);a=mp(f),c=Ls(Pa(r,0,Tn)),l=pp(Pa(r,Tn,64)),u=Kr(ti(c),o,s)}catch{return!1}return aE(i(u),f=>{try{const{x:d,y:p}=QM(a,l,Wa(-f)).toAffine();return!(!Xa(p)||d!==c)}catch{return!1}})},bp=(n,e,t)=>wp(n,e,t,_p),Tp=async(n,e,t)=>wp(n,e,t,vp),Ap=Su({keygen:rE,getPublicKey:yp,sign:sE,verify:bp,signAsync:oE,verifyAsync:Tp}),cE=()=>{const n=[];let e=ir,t=e;for(let i=0;i<33;i++){t=e,n.push(t);for(let r=1;r<128;r++)t=t.add(e),n.push(t);e=t.double()}return n};let Tf;const Af=(n,e)=>{const t=e.negate();return n?t:e},lE=n=>{const e=Tf||(Tf=cE());let t=Is,i=ir;for(let r=0;r<33;r++){let s=Number(n&255n);n>>=8n,s>128&&(s-=256,n+=1n);const o=r*128,a=o+Math.abs(s)-1,c=r%2!==0,l=s<0;s===0?i=i.add(Af(c,e[o])):t=t.add(Af(l,e[a]))}if(n!==0n)throw new Error("invalid wnaf");return{p:t,f:i}},{floor:Vl,min:uE,sin:dE}=Math,An="Trystero",Bs=(n,e)=>Array(n).fill(void 0).map(e),fE="0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz",ts=n=>Bs(n,()=>fE[Vl(Math.random()*62)]??"").join(""),fn=ts(20),ar=Promise.all.bind(Promise),Rp=typeof window<"u",{entries:Ji,fromEntries:Cp,keys:an,values:Br}=Object,kt=()=>{},Pp="candidate",ot=n=>(n!==null&&clearTimeout(n),null),rt=n=>new Error(`${An}: ${n}`),jr=(n,e)=>n instanceof Error&&n.message?n.message:typeof n=="string"&&n?n:Qt(n??e),_i=(n,e)=>n instanceof Error?n:rt(jr(n,e)),hE=new TextEncoder,pE=new TextDecoder,Mi=n=>hE.encode(n),Ki=n=>pE.decode(n),zs=n=>n.reduce((e,t)=>e+t.toString(16).padStart(2,"0"),""),Hs=(...n)=>n.join("@"),mE=(n,e)=>{const t=[...n],i=()=>{const s=dE(e++)*1e4;return s-Vl(s)};let r=t.length;for(;r;){const s=Vl(i()*r--),o=t[r];t[r]=t[s],t[s]=o}return t},gE=(n,e,t,i=!1)=>{var r,s;return((r=n.relayConfig)==null?void 0:r.urls)||(i?mE(e,Lp(n.appId)):e).slice(0,((s=n.relayConfig)==null?void 0:s.redundancy)??t)},Qt=JSON.stringify,Zr=n=>{try{return JSON.parse(n)}catch{throw rt(`failed to parse JSON: ${n}`)}},Lp=(n,e=Number.MAX_SAFE_INTEGER)=>n.split("").reduce((t,i)=>t+i.charCodeAt(0),0)%e,Rf=3333,Cf=6e4,ms={};let Ds=null,Us=null;const _E=()=>{Ds||(Ds=new Promise(n=>{Us=n}).finally(()=>{Us=null,Ds=null}))},vE=()=>{Us==null||Us()},yE=(n,e,t)=>{const i={};let r=!1,s=!1,o,a=kt;i.isClosed=!1,i.ready=new Promise(l=>a=l);const c=()=>{if(i.isClosed)return;o=void 0,s=!1;const l=new WebSocket(n);l.onclose=()=>{if(i.isClosed||s)return;if(s=!0,Ds){Ds.then(c);return}const u=ms[n]??(ms[n]=Rf);if(u>=Cf){i.isClosed=!0;return}o=setTimeout(c,Math.random()*u),ms[n]=uE(u*2,Cf)},l.onmessage=u=>e(String(u.data)),i.socket=l,i.url=l.url,l.onopen=()=>{const u=r;r=!0,a(i),ms[n]=Rf,u&&(t==null||t())},i.send=u=>{l.readyState===1&&l.send(u)}};return i.close=()=>{i.isClosed=!0,o!==void 0&&(clearTimeout(o),o=void 0),i.socket.close()},c(),i},xE=n=>{const e={},t=new WeakMap,i=o=>{const a=t.get(o);if(!a)throw rt("relay bookkeeping missing registration for relay client");return a},r=()=>{const o={},a=c=>o[c]??(o[c]={});return{forKey:a,forRelay:c=>a(i(c))}},s=(o,a)=>(e[o]=a,t.set(a,o),a);return{register:(o,a)=>{const c=e[o];return c||s(o,a())},keyOf:i,scoped:r,getSockets:()=>Cp(Ji(e).flatMap(([o,a])=>{const c=n(a);return c?[[o,c]]:[]}))}},SE=()=>{if(Rp){const n=new AbortController;return addEventListener("online",vE,{signal:n.signal}),addEventListener("offline",_E,{signal:n.signal}),()=>n.abort()}return kt},bu="AES-GCM",kc={},ME=n=>btoa(String.fromCharCode.apply(null,Array.from(new Uint8Array(n)))),EE=n=>{const e=atob(n);return new Uint8Array(e.length).map((t,i)=>e.charCodeAt(i)).buffer},qa=async(n,e)=>new Uint8Array(await crypto.subtle.digest(n,Mi(e))),Gs=async n=>kc[n]??(kc[n]=Array.from(await qa("SHA-1",n)).map(e=>e.toString(36)).join("")),wE=async(n,e,t)=>crypto.subtle.importKey("raw",await crypto.subtle.digest({name:"SHA-256"},Mi(`${n}:${e}:${t}`)),{name:bu},!1,["encrypt","decrypt"]),bE=async(n,e)=>zs(await qa("SHA-256",`${An}:${n}:${e}`)),Ip="$",Dp=",",TE=async(n,e)=>{const t=crypto.getRandomValues(new Uint8Array(16));return t.join(Dp)+Ip+ME(await crypto.subtle.encrypt({name:bu,iv:t},await n,Mi(e)))},AE=async(n,e)=>{const[t,i]=e.split(Ip);return Ki(await crypto.subtle.decrypt({name:bu,iv:new Uint8Array((t==null?void 0:t.split(Dp).map(Number))??[])},await n,EE(i??"")))},Tu=57333,RE=18e4,CE=20;var PE=class{constructor(n){B(this,"makeOffer");B(this,"pool",[]);B(this,"pooled",new Set);B(this,"leased",new Map);B(this,"recycling",new Set);B(this,"cleanupTimer",null);B(this,"active",!1);this.makeOffer=n}get isActive(){return this.active}warmup(){this.pool=[],this.pooled.clear(),Bs(CE,this.makeOffer).forEach(n=>this.push(n)),this.active=!0,this.cleanupTimer=setInterval(()=>{this.pool=this.pool.filter(n=>n.isDead?(this.pooled.delete(n),!1):!0)},Tu)}push(n){n.isDead||this.pooled.has(n)||this.leased.has(n)||(this.pool.push(n),this.pooled.add(n))}shift(n){const e=[];for(;e.length<n&&this.pool.length>0;){const t=this.pool.shift();if(!t)break;this.pooled.delete(t),e.push(t)}return e}claimLeased(n){const e=this.leased.get(n);e&&(ot(e),this.leased.delete(n))}recycle(n){if(!(n.isDead||this.recycling.has(n))){if(n.connection.remoteDescription){n.destroy();return}if(!this.active){n.destroy();return}this.recycling.add(n),n.setHandlers({connect:kt,close:kt,error:kt}),n.getOffer(!0).then(e=>{if(!e||e.type!=="offer"||n.isDead||!this.active){n.destroy();return}this.push(n)}).catch(()=>n.destroy()).finally(()=>this.recycling.delete(n))}}reclaimLeased(n){const e=this.leased.get(n);e&&(ot(e),this.leased.delete(n),this.recycle(n))}lease(n){this.claimLeased(n),this.leased.set(n,setTimeout(()=>{this.leased.delete(n),this.recycle(n)},RE))}checkout(n,e,t){const i=this.shift(n),r=Math.max(0,n-i.length);r>0&&i.push(...Bs(r,this.makeOffer));const s=async(o,a=!1)=>{try{const c=await t(o);return e?(this.lease(o),{peer:o,offer:c,claim:()=>this.claimLeased(o),reclaim:()=>this.reclaimLeased(o)}):{peer:o,offer:c}}catch(c){if(this.claimLeased(o),this.pooled.delete(o),o.destroy(),!a)return s(this.makeOffer(),!0);throw c}};return ar(i.map(o=>s(o)))}getOffers(n,e){return this.checkout(n,!0,e)}destroy(){this.active=!1,this.cleanupTimer&&(clearInterval(this.cleanupTimer),this.cleanupTimer=null),this.pool.forEach(n=>n.destroy()),this.pool=[],this.pooled.clear(),this.leased.forEach((n,e)=>{ot(n),e.destroy()}),this.leased.clear(),this.recycling.forEach(n=>n.destroy()),this.recycling.clear()}};const Oc=rt("incorrect password for overlapping room"),LE=(n,e,t)=>{const i=o=>qa("SHA-256",`${o}:${n}:${e}:${t}`).then(zs),r=async(o,a,c)=>{if(!n)return;if(c){const u=ts(36);await o({__trystero_pw:"challenge",c:u});const{data:f}=await a();if(!f||typeof f!="object"||f.__trystero_pw!=="response"||typeof f.h!="string")throw Oc;const d=await i(u);if(f.h!==d)throw Oc;return}const{data:l}=await a();if(!l||typeof l!="object"||l.__trystero_pw!=="challenge"||typeof l.c!="string")throw Oc;await o({__trystero_pw:"response",h:await i(l.c)})};return{run:r,compose:o=>n||o?async(a,c,l,u)=>{await r(c,l,u),await(o==null?void 0:o(a,c,l,u))}:void 0}},IE=n=>{const e=jr(n,"unknown error");return e.startsWith("handshake ")?e:`handshake failed: ${e}`},DE=({onPeerHandshake:n,onHandshakeError:e,handshakeTimeoutMs:t,sendHandshakeData:i,sendHandshakeReady:r,onActivate:s,onFailure:o})=>{const a={},c=(f,d)=>{const p=a[f];!p||d&&p.peer!==d||p.isActive||!p.didLocalHandshakePass||!p.didReceiveRemoteReady||(p.isActive=!0,p.handshakeTimer=ot(p.handshakeTimer),s(f,p.peer))},l=(f,d,p)=>{const g=a[f];if(!g||g.peer!==d)return;const _=IE(p);e==null||e(f,_),o(f,d,rt(_))},u=(f,d)=>{const p=a[f];!p||p.peer!==d||p.isActive||(p.didLocalHandshakePass=!0,r("",f).catch(g=>l(f,d,rt(`failed sending handshake readiness: ${jr(g,"unknown send failure")}`))),c(f,d))};return{addPeer:(f,d)=>{a[f]={peer:d,isActive:!1,didLocalHandshakePass:!1,didReceiveRemoteReady:!1,handshakeTimer:null,pendingHandshakePayloads:[],handshakeWaiters:[]}},clearPeer:(f,d)=>{const p=a[f];p&&(p.handshakeTimer=ot(p.handshakeTimer),p.pendingHandshakePayloads.length=0,p.handshakeWaiters.splice(0).forEach(g=>g.reject(d)),delete a[f])},canReceiveFromPeer:(f,d)=>{const p=a[f];return!!(p&&(p.isActive||d))},start:(f,d)=>{const p=a[f];if(!p||p.peer!==d)return;p.handshakeTimer=setTimeout(()=>l(f,d,rt(`handshake timed out after ${t}ms`)),t);const g=async(m,v)=>{await i(m,f,v)},_=()=>new Promise((m,v)=>{const y=a[f];if(!y||y.peer!==d){v(rt("peer disconnected during handshake"));return}const S=y.pendingHandshakePayloads.shift();if(S){m(S);return}y.handshakeWaiters.push({resolve:m,reject:b=>v(b)})}),h=fn<f;Promise.resolve(n==null?void 0:n(f,g,_,h)).then(()=>u(f,d)).catch(m=>l(f,d,_i(m,"handshake failed")))},receiveHandshakeData:(f,d,p)=>{const g=a[d];if(!g||g.isActive)return;const _=p===void 0?{data:f}:{data:f,metadata:p},h=g.handshakeWaiters.shift();if(h){h.resolve(_);return}g.pendingHandshakePayloads.push(_)},receiveHandshakeReady:f=>{const d=a[f];!d||d.isActive||(d.didReceiveRemoteReady=!0,c(f))}}},UE=15e3,NE=5e3,Pf="icegatheringstatechange",FE="iceconnectionstatechange",gs="offer",kE="answer",OE=/out of range/i,Lf=n=>n.replace(/ (\S+\.local) (\d+) typ host/g," 127.0.0.1 $2 typ host");var If=(n,{trickleIce:e,rtcConfig:t,rtcPolyfill:i,turnConfig:r,_test_only_mdnsHostFallbackToLoopback:s})=>{const o=new(i??RTCPeerConnection)({iceServers:BE.concat(r??[]),...t}),a={},c=[],l=[],u=e!==!1,f=[],d=[];let p=!1,g=!1,_=null,h=null,m=!1;const v=()=>h=ot(h),y=()=>{var U;m||(m=!0,v(),(U=a.close)==null||U.call(a))},S=U=>{a.signal?a.signal(U):c.push(U)},b=U=>{const K=a.signal;a.signal=se=>{K==null||K(se),U(se)},c.length>0&&c.splice(0).forEach(se=>{var X;return(X=a.signal)==null?void 0:X.call(a,se)})},E=U=>s?Lf(U):U,A=U=>{if(!s||typeof U.candidate!="string")return U;const K=Lf(U.candidate);return K===U.candidate?U:{...U,candidate:K}},C=U=>{var K,se;return{type:((K=U.localDescription)==null?void 0:K.type)??gs,sdp:E(((se=U.localDescription)==null?void 0:se.sdp)??"")}},w=()=>{var K,se;const U=(K=o.remoteDescription)==null?void 0:K.sdp;return U?((se=U.match(/a=ice-ufrag:([^\s]+)/))==null?void 0:se[1])??null:null},x=()=>{var U,K;return(((K=(U=o.remoteDescription)==null?void 0:U.sdp)==null?void 0:K.match(/^m=/gm))??[]).length},P=U=>{if(!o.remoteDescription)return!1;const K=x();if(typeof U.sdpMLineIndex=="number"&&K>0&&U.sdpMLineIndex>=K)return!1;const se=w();return!(se&&U.usernameFragment&&U.usernameFragment!==se)},V=async U=>{try{return await o.addIceCandidate(U),!0}catch(K){if(K instanceof Error&&OE.test(K.message)&&typeof U.sdpMLineIndex=="number")return!1;throw K}},O=async()=>{if(!o.remoteDescription||f.length===0)return;const U=f.splice(0),K=[];for(const se of U){if(!P(se)){K.push(se);continue}await V(se)||K.push(se)}K.length>0&&f.push(...K)},R=async U=>{if(P(U)){await V(U)||f.push(U);return}f.push(U)},I=U=>{U.binaryType="arraybuffer",U.bufferedAmountLowThreshold=65535,U.onmessage=K=>{const se=K.data;a.data?a.data(se):l.push(se)},U.onopen=()=>{var K;return(K=a.connect)==null?void 0:K.call(a)},U.onclose=y,U.onerror=({error:K})=>{var se;return(se=a.error)==null?void 0:se.call(a,_i(K,"data channel error"))}},N=async U=>{let K=null;try{await Promise.race([new Promise(se=>{const X=()=>{U.iceGatheringState==="complete"&&(U.removeEventListener(Pf,X),se())};U.addEventListener(Pf,X),X()}),new Promise(se=>{K=setTimeout(se,UE)})])}finally{ot(K)}return C(U)},H=async()=>{const U=u?C(o):await N(o);return S(U),U};n?(_=o.createDataChannel("data"),I(_)):o.ondatachannel=({channel:U})=>{_=U,I(U)};const F=async(U=!1)=>{var K,se;if(o.connectionState!=="closed")try{return p=!0,U&&(o.signalingState!=="stable"&&o.signalingState!=="closed"&&((K=o.localDescription)==null?void 0:K.type)===gs&&await o.setLocalDescription({type:"rollback"}),typeof o.restartIce=="function"&&o.restartIce()),await o.setLocalDescription(U?await o.createOffer({iceRestart:!0}):void 0),await H()}catch(X){(se=a.error)==null||se.call(a,_i(X,"failed to create local offer"))}finally{p=!1}};o.onnegotiationneeded=async()=>F(!1),o.onicecandidate=({candidate:U})=>{if(!u||!U)return;const K=A(typeof U.toJSON=="function"?U.toJSON():{candidate:U.candidate,sdpMid:U.sdpMid,sdpMLineIndex:U.sdpMLineIndex,usernameFragment:U.usernameFragment});S({type:Pp,sdp:JSON.stringify(K)})};const ee=()=>{if(o.connectionState==="failed"||o.connectionState==="closed"||o.iceConnectionState==="failed"||o.iceConnectionState==="closed"){y();return}if(o.connectionState==="connected"||o.connectionState==="connecting"||o.iceConnectionState==="connected"||o.iceConnectionState==="completed"||o.iceConnectionState==="checking"){v();return}if(o.connectionState==="disconnected"||o.iceConnectionState==="disconnected"){h||(h=setTimeout(()=>{h=null,(o.connectionState==="disconnected"||o.iceConnectionState==="disconnected")&&y()},NE));return}};o.onconnectionstatechange=ee,o.addEventListener(FE,ee),o.ontrack=U=>{var se,X;const K=U.streams[0];if(K){if(!a.track&&!a.stream){d.push({track:U.track,stream:K});return}(se=a.track)==null||se.call(a,U.track,K),(X=a.stream)==null||X.call(a,K)}},o.onremovestream=U=>{var K;return(K=a.stream)==null?void 0:K.call(a,U.stream)};const ne=n?new Promise(U=>b(K=>{K.type===gs&&U(K)})):Promise.resolve();return n&&queueMicrotask(()=>{var U;!p&&o.signalingState==="stable"&&!o.localDescription&&o.connectionState!=="closed"&&((U=o.onnegotiationneeded)==null||U.call(o,new Event("negotiationneeded")))}),{created:Date.now(),connection:o,get channel(){return _},get isDead(){return o.connectionState==="closed"},getOffer:async(U=!1)=>{var K;if(n)return U?F(!0):((K=o.localDescription)==null?void 0:K.type)===gs?u?C(o):N(o):ne},async signal(U){var K,se,X;if(U.type==="candidate"){try{const j=JSON.parse(U.sdp);j&&typeof j=="object"&&await R(A(j))}catch(j){(K=a.error)==null||K.call(a,_i(j,"failed to parse remote candidate"))}return}if(!((_==null?void 0:_.readyState)==="open"&&!((se=U.sdp)!=null&&se.includes("a=rtpmap"))))try{const j={...U,sdp:E(U.sdp)};if(U.type===gs){if(p||o.signalingState!=="stable"&&!g){if(n)return;await ar([o.setLocalDescription({type:"rollback"}),o.setRemoteDescription(j)])}else await o.setRemoteDescription(j);return await O(),await o.setLocalDescription(),await H()}if(U.type===kE){g=!0;try{await o.setRemoteDescription(j),await O()}finally{g=!1}}}catch(j){(X=a.error)==null||X.call(a,_i(j,"failed to apply remote signal"))}},sendData:U=>_==null?void 0:_.send(U),destroy:()=>{v(),_==null||_.close(),o.close(),p=!1,g=!1,y()},setHandlers:U=>{const{signal:K,...se}=U;Object.assign(a,se),a.data&&l.length>0&&l.splice(0).forEach(X=>{var j;return(j=a.data)==null?void 0:j.call(a,X)}),K&&b(K),(a.track||a.stream)&&d.length>0&&d.splice(0).forEach(({track:X,stream:j})=>{var he,fe;(he=a.track)==null||he.call(a,X,j),(fe=a.stream)==null||fe.call(a,j)})},offerPromise:ne,addStream:U=>U.getTracks().forEach(K=>o.addTrack(K,U)),removeStream:U=>o.getSenders().filter(K=>K.track&&U.getTracks().includes(K.track)).forEach(K=>o.removeTrack(K)),addTrack:(U,K)=>o.addTrack(U,K),removeTrack:U=>{const K=o.getSenders().find(se=>se.track===U);K&&o.removeTrack(K)},replaceTrack:(U,K)=>{const se=o.getSenders().find(X=>X.track===U);if(se)return se.replaceTrack(K)}}};const BE=[...Bs(3,(n,e)=>`stun:stun${e||""}.l.google.com:19302`),"stun:stun.cloudflare.com:3478"].map(n=>({urls:n})),zE=Object.getPrototypeOf(Uint8Array),Bc=32,HE=0,zc=32,Df=34,Hc=35,aa=36,Oi=16*2**10-aa,_s=255,GE=65535,Uf="bufferedamountlow",Nf="close",Ff="error",VE=1e4,WE=n=>n instanceof ArrayBuffer?new Uint8Array(n):new Uint8Array(n.buffer,n.byteOffset,n.byteLength),XE=(n,e=VE)=>n.readyState!=="open"||n.bufferedAmount<=n.bufferedAmountLowThreshold?Promise.resolve(n.readyState==="open"):new Promise(t=>{let i=!1,r=null;const s=c=>{i||(i=!0,n.removeEventListener(Uf,o),n.removeEventListener(Nf,a),n.removeEventListener(Ff,a),ot(r),t(c))},o=()=>s(!0),a=()=>s(!1);if(n.addEventListener(Uf,o),n.addEventListener(Nf,a),n.addEventListener(Ff,a),r=setTimeout(()=>s(!1),e),n.readyState!=="open"){s(!1);return}n.bufferedAmount<=n.bufferedAmountLowThreshold&&s(!0)}),qE=({getPeer:n,getPeerIds:e,canReceiveFromPeer:t,throwIfAborted:i})=>{const r={},s={},o={},a={},c=(f,d,{includePending:p=!1}={})=>(f?Array.isArray(f)?f:[f]:e(p)).flatMap(g=>{const _=n(g,p);return _?[Promise.resolve(d(g,_))]:(console.warn(`${An}: no peer with id ${g} found`),[])});return{makeInternalAction:(f,d={})=>{const p=s[f];if(r[f]&&p){const v=r[f].options;if(v.sendToPending!==!!d.sendToPending||v.receiveWhilePending!==!!d.receiveWhilePending)throw rt(`action type "${f}" cannot be redefined`);return p}if(!f)throw rt("action type argument is required");const g=Mi(f);if(g.byteLength>Bc)throw rt(`action type string "${f}" (${g.byteLength}b) exceeds byte limit (${Bc}). Hint: choose a shorter name.`);const _={sendToPending:!!d.sendToPending,receiveWhilePending:!!d.receiveWhilePending},h=new Uint8Array(Bc);h.set(g);let m=0;return r[f]={onComplete:kt,onProgress:kt,setOnComplete:v=>{r[f].onComplete=v;const y=a[f];y!=null&&y.length&&(delete a[f],y.forEach(({payload:S,peerId:b,metadata:E})=>v(S,b,E)))},setOnProgress:v=>{r[f].onProgress=v},send:async(v,y,S,b,E)=>{i(E);const A=typeof v;if(A==="undefined")throw rt("action data cannot be undefined");const C=A!=="string",w=v instanceof Blob,x=w||v instanceof ArrayBuffer||v instanceof zE,P=S!==void 0,V=x?WE(w?await v.arrayBuffer():v):Mi(C?Qt(v):v),O=P?Mi(Qt(S)):null,R=Math.ceil(V.byteLength/Oi)+(P?1:0)||1,I=Bs(R,(N,H)=>{const F=H===R-1,ee=!!(P&&H===0),ne=new Uint8Array(aa+(ee?(O==null?void 0:O.byteLength)??0:F?V.byteLength-Oi*(R-(P?2:1)):Oi));return ne.set(h),ne.set([m>>8,m&_s],zc),ne.set([Number(F)|Number(ee)<<1|Number(x)<<2|Number(C)<<3],Df),ne.set([Math.round((H+1)/R*_s)],Hc),ne.set(P?ee?O??new Uint8Array:V.subarray((H-1)*Oi,H*Oi):V.subarray(H*Oi,(H+1)*Oi),aa),ne});return m=m+1&GE,await ar(c(y,async(N,H)=>{const{channel:F}=H;let ee=0;for(;ee<R;){i(E);const ne=I[ee];if(!ne)break;if(F&&F.bufferedAmount>F.bufferedAmountLowThreshold){const se=await XE(F);if(i(E),!se)break}const U=n(N,_.sendToPending);if(!U||U!==H)break;H.sendData(ne),ee++;const K=ne[Hc]??_s;b==null||b(K/_s,N,S)}},{includePending:_.sendToPending})),[]},options:_},s[f]={send:r[f].send,onMessage:r[f].setOnComplete,onProgress:r[f].setOnProgress}},handleData:(f,d)=>{var P,V;const p=new Uint8Array(d),g=Ki(p.subarray(HE,zc)).replaceAll("\0",""),_=r[g];if(!t(f,!!(_!=null&&_.options.receiveWhilePending)))return;const h=(p[zc]??0)<<8|(p[33]??0),m=p[Df]??0,v=p[Hc]??0,y=p.subarray(aa),S=!!(m&1),b=!!(m&2),E=!!(m&4),A=!!(m&8);o[f]??(o[f]={}),(P=o[f])[g]??(P[g]={});const C=(V=o[f][g])[h]??(V[h]={chunks:[]});if(b?C.meta=Zr(Ki(y)):C.chunks.push(y),_==null||_.onProgress(v/_s,f,C.meta),!S)return;const w=new Uint8Array(C.chunks.reduce((O,R)=>O+R.byteLength,0));C.chunks.reduce((O,R)=>(w.set(R,O),O+R.byteLength),0),delete o[f][g][h];const x=E?w:A?Zr(Ki(w)):Ki(w);if(_){_.onComplete(x,f,C.meta);return}(a[g]??(a[g]=[])).push({payload:x,peerId:f,...C.meta===void 0?{}:{metadata:C.meta}})},clearPeer:f=>{delete o[f]}}},$E=500,Ir=(n,e)=>{const t=rt(e);return t.kind=n,t.name=n==="aborted"?"AbortError":t.name,t},Gc=n=>{if(n!=null&&n.aborted)throw Ir("aborted","operation aborted")},kf=n=>n&&typeof n=="object"&&!Array.isArray(n)&&typeof n.r=="string"?{r:n.r,...Object.hasOwn(n,"m")?{m:n.m}:{}}:null,YE=n=>n&&typeof n=="object"&&!Array.isArray(n)&&typeof n.r=="string"?{r:n.r,...typeof n.e=="string"?{e:n.e}:{}}:null,Ko=(n,e)=>e===void 0?n:{...n,metadata:e},KE=({getPeer:n,getPeerIds:e,canReceiveFromPeer:t})=>{const i={},r={},s=qE({getPeer:n,getPeerIds:e,canReceiveFromPeer:t,throwIfAborted:Gc}),o=s.makeInternalAction,a=s.handleData,c=p=>{const g=r[p];g&&(ot(g.timer),g.signal&&g.abortHandler&&g.signal.removeEventListener("abort",g.abortHandler),delete r[p])},l=(p,g)=>{Ji(r).forEach(([_,h])=>{h.peerId===p&&(c(_),h.reject(g))})},u=(p,g)=>{s.clearPeer(p),l(p,Ir("disconnected",jr(g,"peer disconnected")))},f=o("@_response");return f.onMessage((p,g,_)=>{const h=YE(_);if(!h)return;const m=r[h.r];if(!(!m||m.peerId!==g)){if(c(h.r),h.e!==void 0){m.reject(Ir("rejected",h.e));return}m.resolve(p)}}),{makeAction:(p,g)=>{if(g&&"onRequest"in g&&g.kind!=="request")throw rt('request actions must use kind: "request"');const _=(g==null?void 0:g.kind)??"message",h=o(p),m=i[p];if(m){if(m.kind!==_)throw rt(`action type "${p}" cannot be redefined`);return m.action}const v={kind:_,action:null,pendingMessages:[],pendingRequests:[],onReceiveProgress:(g==null?void 0:g.onReceiveProgress)??null},y=(R,I)=>R?(N,H)=>R(N,Ko({peerId:H},I)):void 0,S=R=>{v.onReceiveProgress=R},b=(R,I,N)=>{var F;const H=v.kind==="request"?kf(N):null;(F=v.onReceiveProgress)==null||F.call(v,R,Ko({peerId:I},H?H.m:N))};if(h.onProgress(b),_==="message"){let R=(g==null?void 0:g.onMessage)??null;const I=()=>{if(!R)return;const H=R;v.pendingMessages.splice(0).forEach(({payload:F,peerId:ee,metadata:ne})=>{Promise.resolve().then(()=>H(F,Ko({peerId:ee},ne))).catch(U=>console.error(`${An} action handler error:`,U))})},N={send:async(H,F={})=>{await h.send(H,F.target,F.metadata,y(F.onProgress,F.metadata),F.signal)},get onMessage(){return R},set onMessage(H){R=H,I()},get onReceiveProgress(){return v.onReceiveProgress},set onReceiveProgress(H){S(H)}};return h.onMessage((H,F,ee)=>{if(!R){v.pendingMessages.push(ee===void 0?{payload:H,peerId:F}:{payload:H,peerId:F,metadata:ee});return}const ne=R;Promise.resolve().then(()=>ne(H,Ko({peerId:F},ee))).catch(U=>console.error(`${An} action handler error:`,U))}),v.action=N,i[p]=v,I(),N}let E=(g==null?void 0:g.onRequest)??null;const A=R=>{ot(R.timer);const I=v.pendingRequests.indexOf(R);I>-1&&v.pendingRequests.splice(I,1)},C=(R,I,N)=>{f.send(null,R,{r:I,e:jr(N,"request failed")})},w=(R,I)=>{A(R),Promise.resolve().then(()=>I(R.payload,{peerId:R.peerId,...R.metadata===void 0?{}:{metadata:R.metadata},signal:R.controller.signal})).then(async N=>{if(N===void 0)throw rt("request handler returned undefined");await f.send(N,R.peerId,{r:R.requestId})}).catch(N=>C(R.peerId,R.requestId,N)).finally(()=>R.controller.abort())},x=()=>{E&&v.pendingRequests.slice().forEach(R=>w(R,E))},P=(R,I,N,H)=>{if(E){const ee={payload:R,peerId:I,...N===void 0?{}:{metadata:N},requestId:H,controller:new AbortController,timer:null};w(ee,E);return}const F={payload:R,peerId:I,...N===void 0?{}:{metadata:N},requestId:H,controller:new AbortController,timer:setTimeout(()=>{A(F),F.controller.abort(),C(I,H,"request handler unavailable")},$E)};v.pendingRequests.push(F)},V=async(R,I)=>{const{target:N,metadata:H,onProgress:F,signal:ee,timeoutMs:ne}=I;if(Gc(ee),!n(N,!1))throw Ir("disconnected",`no active peer with id ${N}`);const U=ts(20),K=new Promise((se,X)=>{const j={peerId:N,resolve:se,reject:X,timer:null,...ee===void 0?{}:{signal:ee}},he=()=>{c(U),X(Ir("aborted","operation aborted"))};ee&&(j.abortHandler=he,ee.addEventListener("abort",he,{once:!0})),r[U]=j}).catch(se=>{throw se});try{await h.send(R,N,H===void 0?{r:U}:{r:U,m:H},y(F,H),ee);const se=r[U];return se&&ne!==void 0&&(se.timer=setTimeout(()=>{c(U),se.reject(Ir("timeout","request timed out"))},ne)),await K}catch(se){throw c(U),se}},O={request:V,requestMany:async(R,I)=>(Gc(I.signal),await ar(I.targets.map(async N=>{var H,F;try{const ee={peerId:N,status:"fulfilled",value:await V(R,{target:N,...I.metadata===void 0?{}:{metadata:I.metadata},...I.timeoutMs===void 0?{}:{timeoutMs:I.timeoutMs},...I.onProgress===void 0?{}:{onProgress:I.onProgress},...I.signal===void 0?{}:{signal:I.signal}})};return(H=I.onResult)==null||H.call(I,ee),ee}catch(ee){const ne=_i(ee,"request failed");if(ne.kind==="aborted"||!ne.kind)throw ne;const U=ne.kind==="timeout"?{peerId:N,status:"timeout"}:ne.kind==="disconnected"?{peerId:N,status:"disconnected"}:{peerId:N,status:"rejected",error:ne};return(F=I.onResult)==null||F.call(I,U),U}}))),get onRequest(){return E},set onRequest(R){E=R,x()},get onReceiveProgress(){return v.onReceiveProgress},set onReceiveProgress(R){S(R)}};return h.onMessage((R,I,N)=>{const H=kf(N);H&&P(R,I,H.m,H.r)}),v.action=O,i[p]=v,x(),O},makeInternalAction:o,handleData:a,clearPeer:u}},Of=n=>n&&typeof n=="object"&&!Array.isArray(n)&&typeof n.k=="string"?{key:n.k,...typeof n.s=="string"?{streamId:n.s}:{},...typeof n.t=="string"?{trackId:n.t}:{},...Object.hasOwn(n,"m")?{metadata:n.m}:{}}:null,Bf=n=>e=>{let t=n.get(e);return t||(t=ts(20),n.set(e,t)),t},Up=()=>{const n=new WeakMap,e=new WeakMap,t=new Map,i=new Map,r=new Map,s=new Map;return{getStreamKey:Bf(n),getTrackKey:Bf(e),rememberRemoteStream:(o,a,c)=>{t.set(o,a),c&&i.set(c,a)},getRemoteStream:(o,a)=>t.get(o)??(a?i.get(a):void 0),rememberRemoteTrack:(o,a,c,l,u)=>{const f={track:a,stream:c};r.set(o,f),l&&s.set(l,f),u&&i.set(u,c)},getRemoteTrack:(o,a)=>r.get(o)??(a?s.get(a):void 0),clearRemote:()=>{t.clear(),i.clear(),r.clear(),s.clear()}}},jE=({iterate:n,isActive:e,getSharedMediaPeer:t})=>{const i={},r={},s=Up(),o={onPeerStream:null,onPeerTrack:null},a=(u,f,d,p)=>{var g,_,h;e(u)&&((_=(g=t(u))==null?void 0:g.__trysteroMedia)==null||_.rememberRemoteStream(f,d,typeof d.id=="string"?d.id:void 0),(h=o.onPeerStream)==null||h.call(o,d,u,p))},c=(u,f,d,p,g)=>{var _,h,m;e(u)&&((h=(_=t(u))==null?void 0:_.__trysteroMedia)==null||h.rememberRemoteTrack(f,d,p,typeof d.id=="string"?d.id:void 0,typeof p.id=="string"?p.id:void 0),(m=o.onPeerTrack)==null||m.call(o,d,p,u,g))},l=(u,f,d,p,g,_={})=>{const h={k:f,..._,...d===void 0?{}:{m:d}};return n(u,async(m,v)=>{await p(h,m),g(v)})};return{addStream:(u,f,d)=>l(f.target,s.getStreamKey(u),f.metadata,d,p=>p.addStream(u),{s:u.id}),removeStream:(u,f)=>{n(f,(d,p)=>p.removeStream(u))},addTrack:(u,f,d,p)=>l(d.target,s.getTrackKey(u),d.metadata,p,g=>g.addTrack(u,f),{s:f.id,t:u.id}),removeTrack:(u,f)=>{n(f,(d,p)=>p.removeTrack(u))},replaceTrack:(u,f,d,p)=>l(d.target,s.getTrackKey(f),d.metadata,p,g=>g.replaceTrack(u,f),{t:u.id}),receiveStreamMeta:(u,f)=>{var g,_;if(!e(f))return;const d=Of(u);if(!d)return;const p=(_=(g=t(f))==null?void 0:g.__trysteroMedia)==null?void 0:_.getRemoteStream(d.key,d.streamId);if(p){a(f,d.key,p,d.metadata);return}(i[f]??(i[f]=[])).push(d)},receiveTrackMeta:(u,f)=>{var g,_;if(!e(f))return;const d=Of(u);if(!d)return;const p=(_=(g=t(f))==null?void 0:g.__trysteroMedia)==null?void 0:_.getRemoteTrack(d.key,d.trackId);if(p){c(f,d.key,p.track,p.stream,d.metadata);return}(r[f]??(r[f]=[])).push(d)},receiveRemoteStream:(u,f)=>{var p;if(!e(u))return;const d=(p=i[u])==null?void 0:p.shift();d&&a(u,d.key,f,d.metadata)},receiveRemoteTrack:(u,f,d)=>{var g;if(!e(u))return;const p=(g=r[u])==null?void 0:g.shift();p&&c(u,p.key,f,d,p.metadata)},clearPeer:u=>{delete i[u],delete r[u]},get onPeerStream(){return o.onPeerStream},set onPeerStream(u){o.onPeerStream=u},get onPeerTrack(){return o.onPeerTrack},set onPeerTrack(u){o.onPeerTrack=u}}},zf="beforeunload",ZE=1e4,ui=n=>"@_"+n,Ms=new Set,Hf=()=>Ms.forEach(n=>n()),JE=n=>(Ms.add(n),Ms.size===1&&addEventListener(zf,Hf),()=>{Ms.delete(n),Ms.size||removeEventListener(zf,Hf)});var QE=(n,e,t,{onPeerHandshake:i,onHandshakeError:r,handshakeTimeoutMs:s=ZE,isPassive:o=!1}={})=>{const a={},c={},l={},u={onPeerJoin:null,onPeerLeave:null};let f=kt,d=null;const p=(R,I,{includePending:N=!1}={})=>(R?Array.isArray(R)?R:[R]:an(N?a:c)).flatMap(H=>{const F=N?a[H]:c[H];return F?[Promise.resolve(I(H,F))]:(console.warn(`${An}: no peer with id ${H} found`),[])}),g=jE({iterate:(R,I)=>p(R,(N,H)=>I(N,H)),isActive:R=>!!c[R],getSharedMediaPeer:R=>a[R]??null}),_=KE({getPeer:(R,I)=>(I?a:c)[R],getPeerIds:R=>an(R?a:c),canReceiveFromPeer:(R,I)=>!!(d!=null&&d.canReceiveFromPeer(R,I))}),h=_.makeInternalAction,m=_.handleData,v=_.makeAction,y=(R,I=rt("peer disconnected"))=>{var H;const N=_i(I,"peer disconnected");d==null||d.clearPeer(R,N),delete a[R],delete c[R],_.clearPeer(R,N),(H=l[R])==null||H.splice(0).forEach(F=>F.reject(N)),delete l[R],g.clearPeer(R)},S=(R,I,N)=>{var ee;const H=a[R];if(!H||I&&H!==I)return;const F=!!c[R];y(R,N),H.destroy(),F&&((ee=u.onPeerLeave)==null||ee.call(u,R)),e(R)},b=async()=>{await P.send(""),await new Promise(R=>setTimeout(R,99)),Ji(a).forEach(([R,I])=>{I.destroy(),y(R,rt("room left"))}),f(),t()},E=h(ui("ping")),A=h(ui("pong")),C=h(ui("signal")),w=h(ui("stream")),x=h(ui("track")),P=h(ui("leave"),{sendToPending:!0,receiveWhilePending:!0}),V=h(ui("hsdata"),{sendToPending:!0,receiveWhilePending:!0}),O=h(ui("hsready"),{sendToPending:!0,receiveWhilePending:!0});return d=DE({...i===void 0?{}:{onPeerHandshake:i},...r===void 0?{}:{onHandshakeError:r},handshakeTimeoutMs:s,sendHandshakeData:V.send,sendHandshakeReady:O.send,onActivate:(R,I)=>{var N;c[R]=I,(N=u.onPeerJoin)==null||N.call(u,R)},onFailure:(R,I,N)=>S(R,I,N)}),E.onMessage((R,I)=>A.send("",I)),A.onMessage((R,I)=>{var H;const N=l[I];(H=N==null?void 0:N.shift())==null||H.resolve(),N&&!N.length&&delete l[I]}),C.onMessage((R,I)=>{var N;c[I]&&((N=a[I])==null||N.signal(R))}),w.onMessage((R,I)=>g.receiveStreamMeta(R,I)),x.onMessage((R,I)=>g.receiveTrackMeta(R,I)),P.onMessage((R,I)=>S(I,void 0,rt("peer left room"))),V.onMessage((R,I,N)=>d==null?void 0:d.receiveHandshakeData(R,I,N)),O.onMessage((R,I)=>d==null?void 0:d.receiveHandshakeReady(I)),n((R,I)=>{const N=a[I];if(N){if(N===R)return;N.destroy(),y(I,rt("peer replaced"))}a[I]=R,d==null||d.addPeer(I,R),R.setHandlers({data:H=>m(I,H),stream:H=>g.receiveRemoteStream(I,H),track:(H,F)=>g.receiveRemoteTrack(I,H,F),signal:H=>{c[I]&&C.send(H,I)},close:()=>S(I,R,rt("peer disconnected")),error:H=>{console.error(`${An} peer error:`,H),S(I,R,H)}}),d==null||d.start(I,R)}),Rp&&(f=JE(()=>b().catch(kt))),{makeAction:v,leave:b,ping:async R=>{if(!c[R])throw rt(`no active peer with id ${R}`);const I=Date.now();return await new Promise((N,H)=>{const F=l[R]??(l[R]=[]),ee=()=>{const U=l[R];if(!U)return;const K=U.indexOf(ne);K>-1&&U.splice(K,1),U.length||delete l[R]},ne={resolve:()=>{ee(),N()},reject:U=>{ee(),H(U)}};F.push(ne),E.send("",R).catch(U=>ne.reject(_i(U,"peer disconnected")))}),Date.now()-I},isPassive:()=>o,getPeers:()=>Cp(Ji(c).map(([R,I])=>[R,I.connection])),addStream:(R,I={})=>g.addStream(R,I,w.send),removeStream:(R,I={})=>{g.removeStream(R,I.target)},addTrack:(R,I,N={})=>g.addTrack(R,I,N,x.send),removeTrack:(R,I={})=>{g.removeTrack(R,I.target)},replaceTrack:(R,I,N={})=>g.replaceTrack(R,I,N,x.send),get onPeerJoin(){return u.onPeerJoin},set onPeerJoin(R){u.onPeerJoin=R,R&&an(c).forEach(I=>R(I))},get onPeerLeave(){return u.onPeerLeave},set onPeerLeave(R){u.onPeerLeave=R},get onPeerStream(){return g.onPeerStream},set onPeerStream(R){g.onPeerStream=R},get onPeerTrack(){return g.onPeerTrack},set onPeerTrack(R){g.onPeerTrack=R}}};const Np=1,Fp=2,Gf=(n,e)=>{const t=Mi(n),i=new Uint8Array(3+t.byteLength+e.byteLength);return i[0]=Np,i[1]=t.byteLength>>>8&255,i[2]=t.byteLength&255,i.set(t,3),i.set(e,3+t.byteLength),i},ew=(n,e)=>{const t=Mi(n),i=new Uint8Array(4+t.byteLength);return i[0]=Fp,i[1]=Number(e),i[2]=t.byteLength>>>8&255,i[3]=t.byteLength&255,i.set(t,4),i},tw=n=>{const e=new Uint8Array(n);if(e.byteLength<3)return null;if(e[0]===Np){const r=(e[1]??0)<<8|(e[2]??0),s=3+r;return r<=0||e.byteLength<s?null:{type:"room",roomToken:Ki(e.subarray(3,s)),payload:e.subarray(s).slice().buffer}}if(e[0]!==Fp||e.byteLength<4)return null;const t=(e[2]??0)<<8|(e[3]??0),i=4+t;return t<=0||e.byteLength<i?null:{type:"presence",roomToken:Ki(e.subarray(4,i)),isPresent:e[1]===1}},kp=n=>{const{connection:e,channel:t}=n;return n.isDead||e.connectionState==="closed"||e.connectionState==="failed"||e.iceConnectionState==="closed"||e.iceConnectionState==="failed"||(t==null?void 0:t.readyState)==="closing"||(t==null?void 0:t.readyState)==="closed"},nw=n=>{if(kp(n))return"stale";const{channel:e}=n;return!e||e.readyState!=="open"?"transient":"live"};var iw=class{constructor(){B(this,"byApp",{});B(this,"roomPresenceHandlers",{})}getMap(n){var e;return(e=this.byApp)[n]??(e[n]={})}get(n,e){var t;return(t=this.byApp[n])==null?void 0:t[e]}isPeerStale(n){return kp(n)}getHealth(n){return this.isPeerStale(n)?"stale":"live"}setRoomPresenceHandler(n,e){return this.roomPresenceHandlers[n]=e,()=>{this.roomPresenceHandlers[n]===e&&delete this.roomPresenceHandlers[n]}}sendRoomPresence(n,e,t){n.isClosing||n.peer.isDead||n.peer.sendData(ew(e,t))}clear(n,e,{destroyPeer:t}){const i=this.byApp[n],r=i==null?void 0:i[e];if(!r||r.isClosing)return;r.idleTimer=ot(r.idleTimer),r.isClosing=!0,t&&!r.peer.isDead&&r.peer.destroy();const s=Br(r.bindings);r.bindings={},r.bindingsByToken={},r.controlRoomId=null,delete i[e],s.forEach(o=>{var a,c;(c=(a=o.handlers).close)==null||c.call(a),o.pendingData.length=0,o.pendingSendData.length=0,o.pendingTracks.length=0}),r.media.clearRemote(),r.pendingDataByToken.clear(),r.remoteRoomTokens.clear(),an(i).length===0&&delete this.byApp[n]}register(n,e,t,i){const r=this.getMap(n),s=r[e];if(s){if(s.idleTimer=ot(s.idleTimer),s.peer===t)return s;this.clear(n,e,{destroyPeer:!0})}const o={appId:n,peerId:e,peer:t,bindings:{},bindingsByToken:{},pendingDataByToken:new Map,remoteRoomTokens:new Set,idleTimer:null,controlRoomId:null,streamOwners:new Map,trackOwners:new Map,media:Up(),idleMs:i,isClosing:!1};return t.setHandlers({data:a=>this.dispatchData(o,a),signal:a=>this.dispatchSignal(o,a),close:()=>this.clear(n,e,{destroyPeer:!1}),error:a=>{console.error(`${An} peer error:`,a),this.clear(n,e,{destroyPeer:!1})},track:(a,c)=>this.dispatchTrack(o,a,c)}),r[e]=o,o}bind(n,e,t,{onDetach:i}){const r=t.bindings[n];if(r)return t.idleTimer=ot(t.idleTimer),{proxy:r.proxy,isNew:!1};const s={roomId:n,roomToken:null,roomTokenPromise:e,handlers:{},pendingData:[],pendingSendData:[],pendingTracks:[],detach:kt,proxy:{}},o=()=>{t.bindings[n]&&(this.pruneRoomOwnership(t,n),delete t.bindings[n],s.roomToken&&t.bindingsByToken[s.roomToken]===s&&delete t.bindingsByToken[s.roomToken],t.controlRoomId===n&&(t.controlRoomId=an(t.bindings)[0]??null),i(),this.scheduleIdleTimer(t))},a={created:t.peer.created,get connection(){return t.peer.connection},get channel(){return t.peer.channel},get isDead(){return t.peer.isDead},getOffer:c=>t.peer.getOffer(c),signal:c=>t.peer.signal(c),sendData:c=>{if(!s.roomToken){s.pendingSendData.push(c);return}t.peer.sendData(Gf(s.roomToken,c))},destroy:()=>o(),setHandlers:c=>{const{signal:l,...u}=c;Object.assign(s.handlers,u),l&&(s.handlers.signal=l),this.flushBindingQueues(s)},offerPromise:t.peer.offerPromise,addStream:c=>{const l=t.streamOwners.get(c)??new Set,u=l.size===0;l.add(n),t.streamOwners.set(c,l),u&&t.peer.addStream(c)},removeStream:c=>{const l=t.streamOwners.get(c);l&&(l.delete(n),l.size===0&&(t.streamOwners.delete(c),t.peer.removeStream(c)))},addTrack:(c,l)=>{const u=t.trackOwners.get(c)??{stream:l,rooms:new Set},f=u.rooms.size===0;return u.stream=l,u.rooms.add(n),t.trackOwners.set(c,u),f?t.peer.addTrack(c,l):t.peer.connection.getSenders().find(d=>d.track===c)??t.peer.addTrack(c,l)},removeTrack:c=>{const l=t.trackOwners.get(c);l&&(l.rooms.delete(n),l.rooms.size===0&&(t.trackOwners.delete(c),t.peer.removeTrack(c)))},replaceTrack:(c,l)=>{const u=t.trackOwners.get(c);if(u){t.trackOwners.delete(c);const f=t.trackOwners.get(l)??{stream:u.stream,rooms:new Set};u.rooms.forEach(d=>f.rooms.add(d)),t.trackOwners.set(l,f)}return t.peer.replaceTrack(c,l)},__trysteroMedia:t.media};return s.proxy=a,s.detach=o,t.bindings[n]=s,t.controlRoomId??(t.controlRoomId=n),t.idleTimer=ot(t.idleTimer),e.then(c=>{if(t.isClosing||t.bindings[n]!==s)return;s.roomToken=c,t.bindingsByToken[c]=s;const l=t.pendingDataByToken.get(c);l!=null&&l.length&&(s.pendingData.push(...l),t.pendingDataByToken.delete(c)),s.pendingSendData.splice(0).forEach(u=>t.peer.sendData(Gf(c,u))),this.flushBindingQueues(s)}),{proxy:a,isNew:!0}}pruneRoomOwnership(n,e){n.streamOwners.forEach((t,i)=>{t.delete(e),t.size===0&&(n.streamOwners.delete(i),n.peer.removeStream(i))}),n.trackOwners.forEach((t,i)=>{t.rooms.delete(e),t.rooms.size===0&&(n.trackOwners.delete(i),n.peer.removeTrack(i))})}scheduleIdleTimer(n){n.isClosing||an(n.bindings).length>0||(n.idleTimer=ot(n.idleTimer),n.idleTimer=setTimeout(()=>{var t;const e=(t=this.byApp[n.appId])==null?void 0:t[n.peerId];!e||an(e.bindings).length>0||this.clear(n.appId,n.peerId,{destroyPeer:!0})},n.idleMs))}getSignalBinding(n){if(n.controlRoomId){const t=n.bindings[n.controlRoomId];if(t!=null&&t.handlers.signal)return t}const e=Br(n.bindings).find(t=>!!t.handlers.signal);return e?(n.controlRoomId=e.roomId,e):null}flushBindingQueues(n){const{handlers:e}=n;e.data&&n.pendingData.length>0&&n.pendingData.splice(0).forEach(t=>{var i;return(i=e.data)==null?void 0:i.call(e,t)}),(e.track||e.stream)&&n.pendingTracks.length&&n.pendingTracks.splice(0).forEach(({track:t,stream:i})=>{var r,s;(r=e.track)==null||r.call(e,t,i),(s=e.stream)==null||s.call(e,i)})}dispatchData(n,e){var r,s;const t=tw(e);if(!t)return;if(t.type==="presence"){t.isPresent?n.remoteRoomTokens.add(t.roomToken):n.remoteRoomTokens.delete(t.roomToken),(s=(r=this.roomPresenceHandlers)[n.appId])==null||s.call(r,n.peerId,t.roomToken,t.isPresent);return}const i=n.bindingsByToken[t.roomToken];if(!i){const o=n.pendingDataByToken.get(t.roomToken)??[];o.push(t.payload),n.pendingDataByToken.set(t.roomToken,o);return}i.handlers.data?i.handlers.data(t.payload):i.pendingData.push(t.payload)}dispatchSignal(n,e){var t,i,r;(r=(t=this.getSignalBinding(n))==null?void 0:(i=t.handlers).signal)==null||r.call(i,e)}dispatchTrack(n,e,t){Br(n.bindings).forEach(i=>{var r,s,o,a;if(i.handlers.track||i.handlers.stream){(s=(r=i.handlers).track)==null||s.call(r,e,t),(a=(o=i.handlers).stream)==null||a.call(o,t);return}i.pendingTracks.push({track:e,stream:t})})}};const rw=23333,sw=12,ow=7533,aw=23333,Wl="__legacy__",La="offer-placeholder",cw=["offer","answer","candidate"],lw=n=>{if(typeof n=="string")try{const e=Zr(n);return e&&typeof e=="object"?e:null}catch{return null}return n&&typeof n=="object"?n:null},vs=(n,e)=>typeof n[e]=="string"&&n[e]?n[e]:void 0,uw=n=>cw.some(e=>e in n&&(typeof n[e]!="string"||n[e]==="")),Op=(n,e,t,i,r,s)=>{n.toCipher(e).then(o=>{n.isLeaving()||!s()||i(t,Qt(r(o.sdp)))})},dw=()=>({status:"idle",offerPeer:null,offerId:null,offerSdp:null,offerInitPromise:null,offerAnswered:!1,offerRelays:[],offerSignalRelays:[],offerSignalBacklog:[],offerRelayTimers:[],offerExpiryTimer:null,connectedPeer:null,connectedPeerUnhealthySinceMs:null,answeringExpiryTimer:null,answeringPeer:null,answerSent:!1,connectionErrorReported:!1,pendingCandidates:{}}),fw=n=>{var e;return[...n.turnConfig??[],...((e=n.rtcConfig)==null?void 0:e.iceServers)??[]].some(({urls:t})=>(Array.isArray(t)?t:[t]).some(i=>/^turns?:/i.test(i)))},hw=(n,e)=>`could not connect to peer ${n} after exchanging SDP; ${fw(e)?"check that your TURN server URLs and credentials are reachable by both peers":"configure TURN servers with turnConfig or rtcConfig.iceServers"}`,$a=(n,e,t)=>{var i;n.isLeaving()||e.connectedPeer||e.connectionErrorReported||(e.connectionErrorReported=!0,(i=n.onJoinError)==null||i.call(n,{error:hw(t,n.config),appId:n.appId,peerId:t,roomId:n.roomId}))},Vs=(n,e)=>n[e]??(n[e]=dw()),ln=n=>{n.connectedPeer?n.status="connected":n.answeringPeer?n.status="answering":n.offerPeer||n.offerRelays.some(Boolean)?n.status="offering":n.status="idle"},ca=(n,e)=>{n.answeringPeer===e&&(n.answeringExpiryTimer=ot(n.answeringExpiryTimer),n.answeringPeer=null,n.answerSent=!1,ln(n))},Xl=(n,e,t)=>{n.connectedPeer&&(n.connectedPeer.isDead||n.connectedPeer.destroy(),n.connectedPeer=null,n.connectedPeerUnhealthySinceMs=null,ln(n))},Au=(n,e)=>{n.offerRelayTimers[e]=ot(n.offerRelayTimers[e]),n.offerRelays[e]&&(n.offerRelays[e]=void 0,ln(n))},Vf=(n,e)=>{(n==null?void 0:n.offerRelays[e])===La&&Au(n,e)},pw=n=>{if(n.isDead||n.connection.connectionState==="closed")return!0;try{return!!n.connection.remoteDescription}catch{return!0}},Ws=(n,e)=>{const t=n.offerAnswered;n.offerExpiryTimer=ot(n.offerExpiryTimer),n.offerInitPromise=null,n.offerRelays.forEach((i,r)=>Au(n,r)),n.offerRelays=[],n.offerSignalRelays=[],n.offerRelayTimers=[],n.offerSignalBacklog=[],n.offerPeer&&n.offerPeer!==n.connectedPeer&&(t||pw(n.offerPeer)?n.offerPeer.isDead||n.offerPeer.destroy():e.recycle(n.offerPeer)),n.offerPeer=null,n.offerId=null,n.offerSdp=null,n.offerAnswered=!1,n.connectionErrorReported=!1,ln(n)},mw=(n,e,t,i)=>{ot(e.answeringExpiryTimer),e.answeringExpiryTimer=setTimeout(()=>{const r=n.peerStates[t];!r||r.connectedPeer||r.answeringPeer!==i||(r.answerSent&&$a(n,r,t),i.destroy(),ca(r,i),n.checkDeactivate())},aw)},gw=async(n,e,t)=>{const i=t?[t,Wl]:[Wl];for(const r of i){const s=n.pendingCandidates[r];if(s!=null&&s.length){delete n.pendingCandidates[r];for(const o of s)await e.signal(o)}}},Bp=(n,e,t,i=Tu)=>{ot(e.offerExpiryTimer);const r=e.offerId;e.offerExpiryTimer=setTimeout(()=>{const s=n.peerStates[t];!s||s.connectedPeer||s.offerId!==r||(s.offerAnswered&&$a(n,s,t),Ws(s,n.offerPool),n.checkDeactivate())},i)},_w=(n,e,t,i)=>e.offerPeer&&e.offerId&&e.offerSdp?Promise.resolve({peer:e.offerPeer,offer:e.offerSdp,offerId:e.offerId}):(e.offerInitPromise||(e.offerInitPromise=(async()=>{const r=(await n.offerPool.checkout(1,!1,n.encryptOffer))[0];if(!r)throw rt("failed to allocate offer peer");const{peer:s,offer:o}=r;e.offerPeer=s,e.offerId=ts(sw),e.offerSdp=o,e.offerAnswered=!1,e.connectionErrorReported=!1,e.offerSignalBacklog=[],ln(e);const a=()=>{e.offerPeer===s&&!e.connectedPeer&&(e.offerAnswered&&$a(n,e,t),Ws(e,n.offerPool)),n.disconnectPeer(s,t),n.checkDeactivate()};return s.setHandlers({connect:()=>n.connectPeer(s,t,i),signal:c=>{e.offerPeer===s&&(e.offerSignalBacklog.push(c),e.offerSignalRelays.forEach(l=>l==null?void 0:l(c)))},close:a,error:a}),Bp(n,e,t),{peer:s,offer:o,offerId:e.offerId}})().finally(()=>e.offerInitPromise=null)),e.offerInitPromise),vw=async(n,e,t,i,r)=>{if(i){n.attachSharedPeerToRoom(t,i);return}const s=n.peerStates[t];if(!s||s.connectedPeer||s.answeringPeer||s.offerAnswered){Vf(s,e);return}if(s.offerRelays[e]!==La)return;const[o,a]=await ar([Gs(Hs(n.rootTopicPlaintext,t)),_w(n,s,t,e)]);if(n.isLeaving())return;if(s.connectedPeer||s.answeringPeer||s.offerAnswered||s.offerRelays[e]!==La){Vf(s,e);return}s.offerRelayTimers[e]=ot(s.offerRelayTimers[e]),s.offerRelays[e]=!0,ln(s),s.offerRelayTimers[e]=setTimeout(()=>Mw(n,t,e),(n.announceIntervals[e]??n.announceIntervalMs)*.9);let c=!1;s.offerSignalRelays[e]=l=>{c&&(n.isLeaving()||s.connectedPeer||s.offerPeer!==a.peer||s.offerId!==a.offerId||l.type!=="candidate"||Op(n,l,o,r,u=>({peerId:fn,offerId:a.offerId,candidate:u,...n.isPassive?{passive:!0}:{}}),()=>!s.connectedPeer&&s.offerPeer===a.peer&&s.offerId===a.offerId))},r(o,Qt({peerId:fn,offerId:a.offerId,offer:a.offer,...n.isPassive?{passive:!0}:{}})),c=!0,s.offerSignalBacklog.forEach(l=>{var u,f;return(f=(u=s.offerSignalRelays)[e])==null?void 0:f.call(u,l)})},yw=async(n,e,t,i,r,s,o)=>{var p;const a=Vs(n.peerStates,t);if(a.answeringPeer||a.offerAnswered)return;const c=!!(a.offerPeer||a.offerRelays.some(Boolean));if((c||s)&&fn<t)return;c&&Ws(a,n.offerPool);const l=n.initPeer(!1,n.config);a.answeringPeer=l,a.answerSent=!1,a.connectionErrorReported=!1,mw(n,a,t,l),ln(a);const u=()=>{a.answeringPeer===l&&!a.connectedPeer&&a.answerSent&&$a(n,a,t),ca(a,l),n.disconnectPeer(l,t),n.checkDeactivate()};l.setHandlers({connect:()=>n.connectPeer(l,t,e),close:u,error:u});let f;try{f=await n.toPlain({type:"offer",sdp:i})}catch{ca(a,l),(p=n.onJoinError)==null||p.call(n,{error:"incorrect room password when decrypting offer",appId:n.appId,peerId:t,roomId:n.roomId});return}if(l.isDead){ca(a,l);return}const d=await Gs(Hs(n.rootTopicPlaintext,t));n.isLeaving()||(l.setHandlers({signal:g=>{n.isLeaving()||a.answeringPeer!==l||l.isDead||g.type!=="answer"&&g.type!=="candidate"||Op(n,g,d,o,_=>{const h={peerId:fn};return g.type==="answer"?(a.answerSent=!0,h.answer=_):h.candidate=_,r&&(h.offerId=r),n.isPassive&&(h.passive=!0),h},()=>a.answeringPeer===l&&!l.isDead)}}),await l.signal(f),await gw(a,l,r))},xw=async(n,e,t,i,r)=>{var f;let s;try{s=await n.toPlain({type:Pp,sdp:t})}catch{return}const o=Vs(n.peerStates,e),a=i&&(o!=null&&o.offerPeer)&&o.offerId===i?o.offerPeer:null,c=(o==null?void 0:o.answeringPeer)??null,l=!i&&(o!=null&&o.offerPeer)?o.offerPeer:null,u=r&&!r.isDead?r:a??c??l;if(!u||u.isDead){const d=i??Wl;((f=o.pendingCandidates)[d]??(f[d]=[])).push(s);return}u.signal(s)},Sw=async(n,e,t,i,r,s)=>{var a;let o;try{o=await n.toPlain({type:"answer",sdp:i})}catch{(a=n.onJoinError)==null||a.call(n,{error:"incorrect room password when decrypting answer",appId:n.appId,peerId:t,roomId:n.roomId});return}if(s)n.offerPool.claimLeased(s),s.setHandlers({connect:()=>n.connectPeer(s,t,e),close:()=>n.disconnectPeer(s,t)}),s.signal(o);else{const c=n.peerStates[t];if(!c||!c.offerPeer||c.offerAnswered||r&&c.offerId&&r!==c.offerId||c.offerPeer.isDead)return;c.offerAnswered=!0,Bp(n,c,t,rw),c.offerPeer.signal(o)}},Mw=(n,e,t)=>{const i=n.peerStates[e];!i||i.connectedPeer||i.offerRelays[t]&&(Au(i,t),n.checkDeactivate())},Ew=n=>e=>async(t,i,r)=>{var S;if(n.isLeaving())return;const s=lw(i);if(!s||uw(s))return;const o=vs(s,"peerId")??"",a=vs(s,"offer"),c=vs(s,"answer"),l=vs(s,"candidate"),u=vs(s,"offerId"),f=s.peer,d=s.hasOutgoingOffer===!0,p=s.passive===!0;if(!o||o===fn)return;const[g,_]=await ar([n.rootTopicP,n.selfTopicP]);if(n.isLeaving()||t!==g&&t!==_||n.isPassive&&p||(n.isPassive&&!n.isActive&&!c&&!l&&(n.isActive=!0,(S=n.requeueAnnounce)==null||S.call(n)),n.isPassive&&!n.isActive))return;const h=n.peerStates[o],m=h==null?void 0:h.connectedPeer;if(m&&h){const b=nw(m);if(b==="live"){h.connectedPeerUnhealthySinceMs=null;return}if(b==="stale")Xl(h);else{const E=Date.now(),A=h.connectedPeerUnhealthySinceMs??E;if(h.connectedPeerUnhealthySinceMs=A,E-A<ow)return;Xl(h)}}let v=n.sharedPeers.get(n.appId,o);v&&n.sharedPeers.getHealth(v.peer)==="stale"&&(n.sharedPeers.clear(n.appId,o,{destroyPeer:!0}),v=void 0);const y=!!(o&&!a&&!c&&!l);if(y&&!v){const b=Vs(n.peerStates,o),E=fn<o;if(b.answeringPeer||b.connectedPeer||b.offerAnswered)return;if(!E&&!b.offerPeer){const A=await Gs(Hs(n.rootTopicPlaintext,o));!n.isLeaving()&&!b.connectedPeer&&r(A,Qt({peerId:fn}));return}if(b.offerRelays[e])return;b.offerRelays[e]=La,ln(b)}if(v&&(a||c||l)){if(v.bindings[n.roomId])return;n.attachSharedPeerToRoom(o,v);return}if(y)return vw(n,e,o,v,r);if(a)return yw(n,e,o,a,u,d,r);if(l)return xw(n,o,l,u,f);if(c)return Sw(n,e,o,c,u,f)},jo=5333,ww=[233,533,1333],bw=7533,Tw=123333;var Aw=({init:n,subscribe:e,announce:t,deactivate:i})=>{const r={},s={},o={},a={},c=new iw,l=()=>Br(r).some(b=>an(b).length>0),u=b=>s[b]??(s[b]={}),f=b=>o[b]??(o[b]={}),d=(b,E,A)=>{c.getHealth(b.peer)==="live"&&c.sendRoomPresence(b,E,A)},p=(b,E)=>{Ji(s[b]??{}).forEach(([A,C])=>{if(!C.shouldAdvertise())return;const{roomToken:w,roomTokenPromise:x}=C;if(w){d(E,w,!0);return}x.then(P=>{var V;((V=s[b])==null?void 0:V[A])===C&&C.roomToken===P&&(c.get(b,E.peerId)!==E||E.isClosing||C.shouldAdvertise()&&d(E,P,!0))})})},g=(b,E,A)=>Br(c.getMap(b)).forEach(C=>d(C,E,A)),_=b=>{a[b]||(a[b]=c.setRoomPresenceHandler(b,(E,A,C)=>{var P,V,O;if(!C)return;const w=c.get(b,E),x=(P=o[b])==null?void 0:P[A];!w||!x||(O=(V=s[b])==null?void 0:V[x])==null||O.attachSharedPeerToRoom(E,w)}))},h=b=>{var E;r[b]&&an(r[b]).length>0||((E=a[b])==null||E.call(a),delete a[b],delete s[b],delete o[b])};let m=!1,v=[],y=null,S=kt;return(b,E,A)=>{var He,ue;if(!b)throw rt("requires a config map as the first argument");if(A&&typeof A!="object")throw rt("third argument must be a callbacks object");const{appId:C}=b,w=A==null?void 0:A.onJoinError,x=A==null?void 0:A.onPeerHandshake,P=A==null?void 0:A.handshakeTimeoutMs;if(!C)throw rt("config map is missing appId field");if(!E)throw rt("roomId argument required");if(P!==void 0&&(!Number.isFinite(P)||P<=0))throw rt("handshakeTimeoutMs must be a positive number");if((He=r[C])!=null&&He[E])return r[C][E];_(C);const V=Hs(An,C,E),O=Gs(V),R=Gs(Hs(V,fn)),I=wE(b.password??"",C,E),N=bE(C,E),H=b._test_only_sharedPeerIdleMs??Tw;let F=!1;const ee=J=>async ge=>({type:ge.type,sdp:await J(I,ge.sdp)}),ne=ee(AE),U=ee(TE),K=c.getMap(C),se=()=>If(!0,b);let X=!1;y||(y=new PE(se));const j=y,he=async J=>{const ge=await J.getOffer(Date.now()-J.created>Tu);if(!ge||ge.type!=="offer")throw rt("failed to get offer for peer");return(await U(ge)).sdp},fe=(J,ge)=>{const _e=Vs(Ie.peerStates,J);_e.answeringExpiryTimer=ot(_e.answeringExpiryTimer),_e.answeringPeer=null;const{proxy:ce,isNew:ae}=c.bind(E,N,ge,{onDetach:()=>{const Te=Ie.peerStates[J];(Te==null?void 0:Te.connectedPeer)===ge.peer&&(Te.connectedPeer=null,Te.connectedPeerUnhealthySinceMs=null,ln(Te))}});_e.connectedPeer=ge.peer,_e.connectedPeerUnhealthySinceMs=null,ln(_e),ae&&re(ce,J),Ws(_e,j)},Ce=(J,ge,_e)=>{if(F){J.destroy();return}const ce=Vs(Ie.peerStates,ge);if(ce.connectedPeer){const Xe=K[ge];if(Xe&&ce.connectedPeer===Xe.peer&&Xe.bindings[E])return;ce.connectedPeer!==J&&!J.isDead&&J.destroy();return}let ae=K[ge];if(ae&&c.getHealth(ae.peer)==="stale"&&(c.clear(C,ge,{destroyPeer:!0}),ae=void 0),ae&&ae.peer!==J){J.isDead||J.destroy(),fe(ge,ae);return}const Te=!ae;ae||(ae=c.register(C,ge,J,H)),fe(ge,ae),Te&&p(C,ae)},Ne=(J,ge)=>{var ce;if(F)return;const _e=Ie.peerStates[ge];(_e==null?void 0:_e.connectedPeer)===J&&(Xl(_e),Ye(),!Se&&X&&((ce=Ie.requeueAnnounce)==null||ce.call(Ie)))},Se=!!b.passive;let $e=null,D,ct=kt;const Ye=()=>{if(!Se||!Ie.isActive)return;let J=!1;Ji(Ie.peerStates).forEach(([ge,_e])=>{_e.connectedPeer||_e.answeringPeer||_e.offerInitPromise||_e.offerPeer||_e.offerRelays.some(Boolean)?J=!0:_e.status==="idle"&&delete Ie.peerStates[ge]}),J||(Ie.isActive=!1,D=ot(D),M.forEach(ot),M.length=0,ct(),$e!=null&&$e.roomToken&&g(C,$e.roomToken,!1))},Ie={appId:C,roomId:E,config:b,peerStates:{},rootTopicPlaintext:V,rootTopicP:O,selfTopicP:R,toPlain:ne,toCipher:U,isLeaving:()=>F,isPassive:Se,isActive:!Se,onJoinError:w,sharedPeers:c,offerPool:j,encryptOffer:he,initPeer:If,connectPeer:Ce,disconnectPeer:Ne,attachSharedPeerToRoom:fe,checkDeactivate:Ye,announceIntervals:[],announceIntervalMs:jo},Re={config:b,appId:C,roomId:E,isPassive:Se},dt=Ew(Ie);if(!m){const J=n(b);v=(Array.isArray(J)?J:[J]).map(ge=>Promise.resolve(ge)),m=!0,S=(ue=b.relayConfig)!=null&&ue.manualReconnection?kt:SE()}!Se&&!j.isActive&&j.warmup(),Ie.announceIntervals=v.map(()=>jo);const Fe=v.map(()=>jo),Be=v.map(()=>0),L=v.map(()=>0),M=[],Y=v.map(async(J,ge)=>e(await J,await O,await R,dt(ge),_e=>j.getOffers(_e,he),Re));ar([O,R]).then(([J,ge])=>{if(F)return;const _e=async(ce,ae)=>{var te;if(F||Se&&!Ie.isActive)return;const Te=Se?{passive:!0}:void 0;let Xe;try{Xe=await t(ce,J,ge,Te,Re),L[ae]=0}catch(me){const De=L[ae]??0;De===0&&((te=b.relayConfig)==null?void 0:te.warnOnRelayFailure)!==!1&&console.warn(`${An}: announce failed - ${jr(me,"")}`),L[ae]=De+1}if(F||Se&&!Ie.isActive||Xe&&typeof Xe!="number"&&"stopAnnouncing"in Xe)return;typeof Xe=="number"?(Ie.announceIntervals[ae]=Xe,Fe[ae]=Xe):Xe&&(Fe[ae]=Xe.nextAnnounceMs,X||(X=Xe.reannounceOnDisconnect===!0));const k=Be[ae]??0;Be[ae]=k+1;const de=Fe[ae]??jo,Q=ww[k];M[ae]=setTimeout(()=>{_e(ce,ae)},typeof Q=="number"?Math.min(de,Q):de)};ct=()=>{i&&v.forEach(async ce=>{const ae=await ce;F||i(ae,J,ge,Re)})},Ie.requeueAnnounce=()=>{M.forEach(ot),M.length=0,D=ot(D),j.isActive||j.warmup(),$e!=null&&$e.roomToken&&g(C,$e.roomToken,!0),D=setTimeout(Ye,bw),v.forEach(async(ce,ae)=>{const Te=await ce;Te&&!F&&(Be[ae]=0,_e(Te,ae))})},Y.forEach(async(ce,ae)=>{if(await ce,F)return;const Te=await v[ae];Te&&!F&&(!Se||Ie.isActive)&&_e(Te,ae)})});let re=kt;const{compose:oe}=LE(b.password??"",C,E),ie=oe(x),Le={...ie?{onPeerHandshake:ie}:{},...P===void 0?{}:{handshakeTimeoutMs:P},isPassive:Se,onHandshakeError:(J,ge)=>w==null?void 0:w({error:ge.replace(/^handshake failed: /,""),appId:C,peerId:J,roomId:E})};r[C]??(r[C]={});const ye=u(C),Ee=QE(J=>re=J,J=>{if(F)return;const ge=Ie.peerStates[J];ge!=null&&ge.connectedPeer&&(ge.connectedPeer=null,ln(ge),Ye())},()=>{var ge,_e;F=!0,re=kt;const J=(ge=s[C])==null?void 0:ge[E];J!=null&&J.roomToken&&(g(C,J.roomToken,!1),(_e=o[C])==null||delete _e[J.roomToken],o[C]&&!an(o[C]).length&&delete o[C]),s[C]&&(delete s[C][E],an(s[C]).length||delete s[C]),Ji(Ie.peerStates).forEach(([ce,ae])=>{if(ae.answeringExpiryTimer=ot(ae.answeringExpiryTimer),ae.connectedPeer&&!ae.connectedPeer.isDead){const Te=K[ce];(!Te||Te.peer!==ae.connectedPeer)&&ae.connectedPeer.destroy()}ae.answeringPeer&&!ae.answeringPeer.isDead&&ae.answeringPeer.destroy(),Ws(ae,j),ae.connectedPeer=null,ae.answeringPeer=null,ln(ae)}),r[C]&&(delete r[C][E],an(r[C]).length===0&&delete r[C]),M.forEach(ot),D=ot(D),Y.forEach(async ce=>{(await ce)()}),!l()&&(m=!1,j.destroy(),y=null,S(),h(C))},Le);return $e={roomToken:null,roomTokenPromise:N,attachSharedPeerToRoom:fe,shouldAdvertise:()=>!Se||Ie.isActive},ye[E]=$e,N.then(J=>{var _e;const ge=$e;!ge||F||((_e=s[C])==null?void 0:_e[E])!==ge||(ge.roomToken=J,f(C)[J]=E,Br(K).forEach(ce=>{ce.remoteRoomTokens.has(J)&&fe(ce.peerId,ce)}),(!Se||Ie.isActive)&&g(C,J,!0))}),r[C][E]=Ee}};const Rw=["offer","answer","candidate"],Cw=6e4,Pw=n=>{if(typeof n=="string")try{const e=Zr(n);return e&&typeof e=="object"?e:null}catch{return null}return n},Vc=(n,e)=>typeof n[e]=="string"&&n[e]?n[e]:void 0,Lw=n=>Rw.some(e=>e in n&&(typeof n[e]!="string"||n[e]==="")),Iw=n=>{const e=Pw(n);if(!e||Lw(e))return!1;const t=Vc(e,"peerId");return!!(t&&t!==fn&&e.passive!==!0&&!Vc(e,"answer")&&!Vc(e,"candidate"))},Wc=n=>{if(!n)throw rt("topic strategy missing room context");return n},Wf=(n,e,t,i)=>({kind:e,appId:n.appId,roomId:n.roomId,rootTopic:t,selfTopic:i}),Xc=(n,e,t,i)=>({kind:e,appId:n.appId,roomId:n.roomId,rootTopic:t,selfTopic:i});var Dw=({steadyAnnounceIntervalMs:n=Cw,reannounceOnDisconnect:e=!0,init:t,subscribeTopic:i,publishTopic:r,unpublishTopic:s})=>Aw({init:t,subscribe:async(o,a,c,l,u,f)=>{const d=Wc(f),p=(b,E)=>void r(o,b,E,Xc(d,"signal",a,c));let g=null,_=!1,h=null,m=!1;const v=b=>{_||(_=!0,b())},y=()=>(h||(h=Promise.resolve(i(o,c,(b,E)=>{m||l(b,E,p)},Wf(d,"self",a,c))).then(b=>{g=b,m&&v(b)})),h);d.isPassive||await y();const S=await i(o,a,async(b,E)=>{m||(d.isPassive&&Iw(E)&&await y(),m||await l(b,E,p))},Wf(d,"root",a,c));return()=>{m=!0,g&&v(g),S()}},announce:async(o,a,c,l,u)=>{const f=Wc(u),d=await r(o,a,Qt({peerId:fn,...l}),Xc(f,"announce",a,c));return typeof d=="number"||d!==void 0&&"stopAnnouncing"in d?d:{nextAnnounceMs:(d==null?void 0:d.nextAnnounceMs)??n,reannounceOnDisconnect:(d==null?void 0:d.reannounceOnDisconnect)??e}},...s?{deactivate:(o,a,c,l)=>{const u=Wc(l);return s(o,a,Xc(u,"announce",a,c))}}:{}});const Uw=xE(n=>n.socket),Nw=5,zp="x",Hp="EVENT",{secretKey:Fw,publicKey:kw}=Ap.keygen(),Ow=zs(kw),Bw={},zw={},qc={},Xf=250,Ia=6e4,Hw=15*6e4,Gw=5333,Xs=new WeakMap,ql=new WeakSet,Qi=new WeakMap,qf=n=>{const e=Xs.get(n),t=Math.min(e!=null&&e.delayMs?Math.max(Ia,e.delayMs*2):Ia,Hw);return Xs.set(n,{delayMs:t,untilMs:Date.now()+t}),t},Vw=n=>{const e=Xs.get(n);if(!e)return 0;const t=e.untilMs-Date.now();return t>0?t:0},$c=n=>({nextAnnounceMs:n}),Ww={stopAnnouncing:!0},Xw=n=>{var t;if(ql.has(n))return!1;const e=Qi.get(n);return e&&(clearTimeout(e.timer),Qi.delete(n)),ql.add(n),Xs.delete(n),(t=n.close)==null||t.call(n),!0},qw=(n,e)=>{const t=Qi.get(n);t&&(clearTimeout(t.timer),t.eventIds.add(e));const i=(t==null?void 0:t.eventIds)??new Set([e]),r=setTimeout(()=>{Qi.delete(n)},Gw);Qi.set(n,{eventIds:i,timer:r})},$w=(n,e)=>{const t=Qi.get(n);return t!=null&&t.eventIds.has(e)?(clearTimeout(t.timer),Qi.delete(n),!0):!1},Gp=()=>Math.floor(Date.now()/1e3),Vp=n=>qc[n]??(qc[n]=Lp(n,1e4)+2e4),Yw=async(n,e)=>{const t={kind:Vp(n),tags:[[zp,n]],created_at:Gp(),content:e,pubkey:Ow},i=await qa("SHA-256",Qt([0,t.pubkey,t.created_at,t.kind,t.tags,t.content]));return Qt([Hp,{...t,id:zs(i),sig:zs(await Ap.signAsync(i,Fw))}])},Zn={},Wp=n=>{n.flushWaiters.forEach(e=>e()),n.flushWaiters.clear()},Kw=(n,e,t)=>{var r;const i=Zn[r=n.url]??(Zn[r]={subIds:[],topics:new Map,updateTimer:null,flushWaiters:new Set});i.topics.set(e,t),Xp(n,i)},jw=(n,e)=>{const t=Zn[n.url];t&&(t.topics.delete(e),t.topics.size===0?(t.updateTimer!==null&&(clearTimeout(t.updateTimer),t.updateTimer=null),Wp(t),t.subIds.forEach(i=>n.send(Qt(["CLOSE",i]))),delete Zn[n.url]):Xp(n,t))},Xp=(n,e)=>{e.updateTimer===null&&(e.updateTimer=setTimeout(()=>{e.updateTimer=null;try{qp(n)}finally{Wp(e)}},0))},Zw=n=>{const e=Zn[n.url];return!e||e.updateTimer===null?Promise.resolve():new Promise(t=>e.flushWaiters.add(t))},qp=n=>{const e=Zn[n.url];if(!e||e.topics.size===0)return;const t=[...e.topics.keys()],i=[],r=Gp();for(let s=0;s<t.length;s+=Xf)i.push(t.slice(s,s+Xf));for(;e.subIds.length>i.length;){const s=e.subIds.pop();s&&n.send(Qt(["CLOSE",s]))}i.forEach((s,o)=>{var c;const a=(c=e.subIds)[o]??(c[o]=ts(64));n.send(Qt(["REQ",a,{kinds:[...new Set(s.map(Vp))],since:r,"#x":s}]))})},Jw=n=>{const e=Zn[n.url];e&&e.topics.size>0&&qp(n)},Qw=Dw({init:n=>gE(n,eb,Nw,!0).map(e=>{const t=Uw.register(e,()=>yE(e,i=>{var c,l;const[r,s,o,a]=Zr(i);if(r!==Hp){const u=`${An}: relay failure from ${t.url} - `,f=r==="CLOSED"&&typeof o=="string"?o:a,d=r==="OK"&&o===!1,p=d&&(f==null?void 0:f.startsWith("rate-limited:")),g=d&&(f==null?void 0:f.startsWith("duplicate:")),_=r==="CLOSED"||d&&!p&&!g,h=r==="OK"&&$w(t,s);if(_&&!Xw(t))return;p?qf(t):h&&Xs.delete(t),!g&&((c=n.relayConfig)==null?void 0:c.warnOnRelayFailure)!==!1&&(r==="NOTICE"?console.warn(u+s):(d||r==="CLOSED")&&console.warn(u+f));return}if(o&&typeof o=="object"&&"content"in o){const{content:u}=o,f=zw[s];if(f){f(Bw[s]??"",u);return}const d=Zn[t.url];if(d!=null&&d.subIds.includes(s)&&o.tags){const p=o.tags.find(g=>g[0]===zp);p!=null&&p[1]&&((l=d.topics.get(p[1]))==null||l(p[1],u))}}},()=>Jw(t)));return t.ready}),subscribeTopic:(n,e,t,i)=>{Kw(n,e,(o,a)=>void t(o,a));const s=()=>{jw(n,e)};return i.kind==="root"?Zw(n).then(()=>s):s},publishTopic:async(n,e,t,i)=>{if(ql.has(n)||n.isClosed)return i.kind==="announce"?Ww:void 0;if(i.kind==="announce"){const a=Vw(n);if(a>0)return $c(Math.max(Ia,a))}const r=await Yw(e,typeof t=="string"?t:Qt(t)),s=n.socket.readyState===1;if(n.send(r),i.kind!=="announce")return;if(!s)return $c(qf(n));const o=Zr(r)[1].id;return qw(n,o),$c(Ia)}}),eb=["basspistol.org","bucket.coracle.social","chorus.pjv.me","koru.bitcointxoko.org","nos.lol","nostr-01.uid.ovh","nostr-01.yakihonne.com","nostr-relay.corb.net","nostr.data.haus","nostr.islandarea.net","nostr.sathoarder.com","nostr.tegila.com.br","nostr.vulpem.com","purplerelay.com","relay-can.zombi.cloudrodion.com","relay-rpi.edufeed.org","relay.agorist.space","relay.artio.inf.unibe.ch","relay.mostr.pub","relay.mostro.network","relay.sigit.io","relay02.lnfi.network","schnorr.me","social.amanah.eblessing.co","staging.yabu.me","strfry.shock.network","top.testrelay.top","yabu.me/v2"].map(n=>"wss://"+n),tb=["wss://nos.lol","wss://nostr.data.haus","wss://nostr.vulpem.com","wss://relay.mostr.pub","wss://schnorr.me"],nb={selfId:fn,joinRoom:(n,e)=>Qw(n,e)};function ib(){var n;return(n=globalThis.crypto)!=null&&n.subtle?null:"Multiplayer needs WebCrypto (crypto.subtle), which browsers expose only in a secure context. Use http://localhost:5173 (or HTTPS), not a raw WSL/LAN IP over http."}class rb{constructor(e,t,i=nb){B(this,"selfId");B(this,"room");B(this,"action");B(this,"peerSet",new Set);B(this,"msgCb",()=>{});B(this,"joinCb",()=>{});B(this,"leaveCb",()=>{});this.selfId=i.selfId,this.room=i.joinRoom({appId:e,relayConfig:{urls:[...tb]}},t),this.action=this.room.makeAction("msg"),this.action.onMessage=(r,{peerId:s})=>{r!=null&&this.msgCb(s,FM(r))},this.room.onPeerJoin=r=>{this.peerSet.add(r),this.joinCb(r)},this.room.onPeerLeave=r=>{this.peerSet.delete(r),this.leaveCb(r)}}peers(){return[...this.peerSet]}send(e,t){const i=e==="all"?null:e;this.action.send(NM(t),{target:i}).catch(()=>{})}onMessage(e){this.msgCb=e}onPeerJoin(e){this.joinCb=e}onPeerLeave(e){this.leaveCb=e}disconnect(){this.room.leave().catch(()=>{})}}function $p(n,e){const t=document.createElement("div");t.style.cssText="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(0,0,0,0.78);z-index:10000";const i=document.createElement("div");i.style.cssText="max-width:680px;margin:24px;padding:24px;border:1px solid #666;border-radius:8px;background:#111";const r=document.createElement("h2");r.style.margin="0 0 8px",r.textContent=n;const s=document.createElement("p");s.style.cssText="margin:0;white-space:pre-wrap;line-height:1.5",s.textContent=e,i.append(r,s),t.appendChild(i),document.body.appendChild(t)}const sb=document.getElementById("app"),Rn=new bx({antialias:!0});Rn.setPixelRatio(Math.min(window.devicePixelRatio,2));sb.append(Rn.domElement);const Zt=new Tx,ob=new Ke(666197),ab=new za(13625599,.004),cb=new za(666197,.35);Rn.setClearColor(1055283);const Vt=new sn(70,1,.1,512),lb=70,ub=62;function Yp(){Vt.aspect=window.innerWidth/window.innerHeight,Vt.updateProjectionMatrix(),Rn.setSize(window.innerWidth,window.innerHeight)}window.addEventListener("resize",Yp);Yp();const no=document.createElement("canvas");no.width=256;no.height=256;const Zo=no.getContext("2d");function db(n){let e=n>>>0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function Es(n,e,t,i){n.fillStyle=`rgb(${i[0]|0},${i[1]|0},${i[2]|0})`,n.fillRect(e,t,1,1)}function Vn(n,e,t,i){for(let r=0;r<16;r++)for(let s=0;s<16;s++){const o=(i()-.5)*2*t;Es(n,s,r,[e[0]+o,e[1]+o,e[2]+o])}}const $f=[(n,e)=>Vn(n,[92,158,66],24,e),(n,e)=>{Vn(n,[120,86,52],16,e),n.save(),n.beginPath(),n.rect(0,0,16,3),n.clip(),Vn(n,[92,158,66],18,e),n.restore()},(n,e)=>Vn(n,[120,86,52],18,e),(n,e)=>{Vn(n,[112,112,118],14,e),n.fillStyle="rgba(58,58,64,.85)";for(let t=0;t<4;t++)n.fillRect(e()*14|0,e()*16|0,2+(e()*3|0),1)},(n,e)=>Vn(n,[216,204,152],14,e),(n,e)=>{Vn(n,[48,104,196],12,e),n.fillStyle="rgba(130,185,255,.55)";for(let t=0;t<5;t++)n.fillRect(e()*13|0,e()*16|0,3,1)},(n,e)=>{for(let t=0;t<16;t++){const i=t%4<2?[112,78,44]:[98,68,40];for(let r=0;r<16;r++){const s=(e()-.5)*14;Es(n,t,r,[i[0]+s,i[1]+s,i[2]+s])}}},(n,e)=>{for(let t=0;t<16;t++)for(let i=0;i<16;i++){const s=Math.max(Math.abs(i-7.5),Math.abs(t-7.5))%3<1.5?[152,112,64]:[114,82,48],o=(e()-.5)*10;Es(n,i,t,[s[0]+o,s[1]+o,s[2]+o])}},(n,e)=>Vn(n,[54,118,46],30,e),n=>{n.fillStyle="rgb(196,232,250)",n.fillRect(0,0,16,16),n.fillStyle="rgba(255,255,255,.95)",n.fillRect(0,0,16,1),n.fillRect(0,15,16,1),n.fillRect(0,0,1,16),n.fillRect(15,0,1,16),n.fillStyle="rgba(255,255,255,.55)",n.fillRect(3,3,2,6)},(n,e)=>{for(let t=0;t<16;t++){const i=t%4===3?[70,48,28]:[150,108,62];for(let r=0;r<16;r++){const s=(e()-.5)*14;Es(n,r,t,[i[0]+s,i[1]+s,i[2]+s])}}},(n,e)=>{for(let t=0;t<16;t++)for(let i=0;i<16;i++){const r=i<2||i>13?[74,50,28]:[112,78,44],s=(e()-.5)*14;Es(n,i,t,[r[0]+s,r[1]+s,r[2]+s])}},n=>{n.fillStyle="rgb(255,150,40)",n.fillRect(3,4,10,10),n.fillStyle="rgb(255,214,80)",n.fillRect(5,6,6,7),n.fillStyle="rgb(255,246,205)",n.fillRect(7,8,2,4)},(n,e)=>{Vn(n,[150,108,62],10,e),n.fillStyle="rgba(70,48,28,.9)",n.fillRect(0,0,16,2),n.fillRect(0,14,16,2),n.fillRect(0,0,2,16),n.fillRect(14,0,2,16),n.fillRect(7,3,2,10),n.fillStyle="rgb(220,200,120)",n.fillRect(11,8,2,2)}];for(let n=0;n<$f.length;n++)Zo.save(),Zo.translate(n%16*16,(n/16|0)*16),$f[n](Zo,db(24301+n*2654435769)),Zo.restore();const io=new $r(no);io.magFilter=Ct;io.minFilter=Ct;io.generateMipmaps=!1;const Ru=new Ai({map:io,vertexColors:!0}),Cu=new Ai({map:io,vertexColors:!0,transparent:!0,opacity:.85,depthWrite:!1,side:En}),Kp=[];function jp(n){const e={value:1},t={value:Bl};n.onBeforeCompile=i=>{i.uniforms.uDayness=e,i.uniforms.uAmbient=t,i.vertexShader=i.vertexShader.replace("#include <common>",`#include <common>
attribute vec2 aLight;
varying vec2 vLight;`).replace("#include <begin_vertex>",`#include <begin_vertex>
	vLight = aLight;`),i.fragmentShader=i.fragmentShader.replace("#include <common>",`#include <common>
uniform float uDayness;
uniform float uAmbient;
varying vec2 vLight;
`).replace("#include <color_fragment>",`// per-vertex light: sky component fades with dayness; block light never does
float bwLight = clamp(max(vLight.x, vLight.y * uDayness), 0.0, 1.0);
diffuseColor.rgb *= uAmbient + (1.0 - uAmbient) * bwLight;
#include <color_fragment>`)},Kp.push(e)}jp(Ru);jp(Cu);const Jo=new URLSearchParams(location.search).get("phase"),Zp=Jo!==null&&Jo!==""&&Number.isFinite(+Jo)?+Jo:0,zr=new URLSearchParams(location.search).get("prof")==="remesh",Jp=zr&&new URLSearchParams(location.search).has("norender"),Kn=new URLSearchParams(location.search).get("mp"),Hr=Kn==="host"||Kn==="client",$l=Hr?Math.max(1,parseInt(new URLSearchParams(location.search).get("bots")??(Kn==="host"?"2":"1"),10)||(Kn==="host"?2:1)):0,fb=Hr?Math.max(0,parseInt(new URLSearchParams(location.search).get("delay")??"0",10)||0):0,la=new URLSearchParams(location.search).has("host"),Qp=new URLSearchParams(location.search).get("join"),hb=la||Qp!==null,pb="block-world";let je=new xu(Zp);const mb=sM(Zt,ab,cb,ob),Yf=yM(Zt),gb=document.getElementById("clock");let Kf="";const Yc=document.getElementById("scrub"),jf=document.getElementById("scrub-label"),Yl=document.getElementById("scrub-quit");Yl.addEventListener("click",()=>{const n=new URL(location.href);n.searchParams.delete("replay"),location.href=n.toString()});let Ge=new fu,un=new tp(Ge),pt=new zl(Ge,je);window.__lightDebug=pt;const Da={onEdit:(n,e,t)=>{Ab(n,e,t),pt.edit(n,e,t)},waterEdit:(n,e,t,i)=>{un.edit(n,e,t,i)},springTarget:(n,e,t)=>un.cellState(n,e,t).p===1};let le=new yu(Ge,Da,Gt);const em=n=>n.kindId==="deer"||n.kindId==="dolt"?new Va((e,t,i)=>Ge.getBlock(e,t,i),()=>le.rng.next()):new jt;let Ot;try{const n=new MM;Ot=new Nl(n,Gt,n)}catch{Ot=new Nl(null,Gt)}window.__persistDebug=Ot;const Zf={hasPersisted:()=>!1,syncRecord:()=>{},fetchRecord:()=>Promise.resolve(void 0),onUnload:()=>{},dropPersisted:()=>{}};let mi=null,Jr=!1,It=null,Jf=null;const Kc=new Set;let Ft=null,Ns=null,ji=null,Dr=[],ws=[],Bi=null,Qf=!1,di;function _b(){const n="abcdefghijkmnpqrstuvwxyz23456789";let e="";for(let t=0;t<6;t++)e+=n[Math.floor(Math.random()*n.length)];return e}function vb(n,e,t,i,r){var d;const s=document.createElement("div");s.id="lobby",s.style.cssText="position:fixed;top:12px;right:12px;z-index:9998;background:rgba(0,0,0,.72);color:#fff;font:13px/1.5 sans-serif;padding:10px 12px;border-radius:8px;max-width:300px",s.innerHTML=`<div style="font-weight:600;margin-bottom:6px">${e?"Hosting a world":"Joined a world"}</div><div>Room code</div><div id="lobby-code" style="font:600 20px monospace;letter-spacing:2px;margin:2px 0 6px;user-select:all">${n}</div><button id="lobby-copy" style="cursor:pointer;font:12px sans-serif;padding:4px 8px;background:#2a2a2a;color:#fff;border:1px solid #555;border-radius:4px">copy code</button><button id="lobby-leave" style="display:block;width:100%;margin-top:6px;cursor:pointer;font:12px sans-serif;padding:4px 8px;background:#2a2a2a;color:#fff;border:1px solid #555;border-radius:4px">${e?"stop hosting":"leave lobby"}</button><div id="lobby-peers" style="margin-top:8px;color:#bbb">Peers: ${e?"waiting for players…":"connecting to host…"}</div>`,document.body.appendChild(s);const o=document.createElement("div");o.style.cssText="color:#bbb;margin-bottom:6px",o.textContent=`name: ${r}`,(d=s.firstElementChild)==null||d.after(o);const a=document.getElementById("lobby-copy");a.addEventListener("click",()=>{var p;(p=navigator.clipboard)==null||p.writeText(n).then(()=>{a.textContent="copied!",setTimeout(()=>{a.textContent="copy code"},1200)}).catch(()=>{})}),document.getElementById("lobby-leave").addEventListener("click",()=>{e&&!confirm("Leave? Connected players will be dropped.")||(location.href=location.pathname)});const l=document.getElementById("lobby-peers"),u=()=>{const p=t.peers();l.textContent=p.length?"Peers: "+p.join(", "):e?"Peers: waiting for players…":"Peers: connecting to host…"},f=setInterval(u,500);u(),window.__lobby={code:n,isHost:e,peers:()=>t.peers(),remotePlayers:()=>i.sim.all().filter(p=>p.kind.id==="player"&&p.id!==i.sim.viewedId).map(p=>({id:p.id,name:p.name??null,x:Math.round(p.pos.x*10)/10,z:Math.round(p.pos.z*10)/10})),ownPos:()=>{const p=i.sim.viewed();return p?{x:p.pos.x,y:p.pos.y,z:p.pos.z}:null},_dispose:()=>clearInterval(f)}}let eh=!1;async function tm(n){var s,o,a,c,l;if(eh)return;if(eh=!0,hb){const u=ib();if(u){$p("Multiplayer unavailable",u);return}const f=new URLSearchParams(location.search).get("name")??"",d=qM(f);f.trim()!==""&&localStorage.setItem("bw.name",d);const p=la?new URLSearchParams(location.search).get("host")||_b():Qp,g=new rb(pb,p);let _;if(la){const h=new Uc(g,Gt,{withOwnPlayer:!0,ownController:xt,ownName:d,persist:Ot,hooks:Da});_=h,ji=h,Dr=[],Ge=h.world,le=h.sim,un=h.waterSim,je=h.worldTime;{const m=h.sim.viewed();m&&xt.setLook(m.yaw,m.pitch)}}else{const h=new gi(g,d,xt);_=h,ji=null,Dr=[h],h.setLightEdit((m,v,y)=>{pt==null||pt.edit(m,v,y)}),h.onPeerLeave(m=>{if(m===h.hostId&&Ft===h){Ft=null;const v=document.createElement("div");v.style.cssText="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font:600 24px sans-serif;z-index:9999;pointer-events:none;text-shadow:0 0 8px #000",v.textContent="host left",document.body.appendChild(v)}}),Ge=h.world,le=h.sim,je=h.worldTime}pt=new zl(Ge,je),window.__lightDebug=pt,Ft=_,Ns=null,vb(p,la,g,_,d),bs(),requestAnimationFrame(As);return}if(Hr){const u=new AM({delay:d=>d==="host"||d==="headless"?fb:0});let f;if(Kn==="host"){f=new Uc(u.connect("host"),Gt,{withOwnPlayer:!0,persist:Ot,hooks:Da});const d=f;ji=d;const p=[{op:"walkTo",x:8,z:48,timeout:120},{op:"walkTo",x:12,z:44,timeout:120},{op:"walkTo",x:6,z:50,timeout:120},{op:"wait",ticks:60}];for(let g=0;g<$l;g++){const _=new gi(u.connect(`bot${g}`),`bot${g}`,new Ol(p,!0));_.setLightEdit(()=>{}),Dr.push(_)}Ge=d.world,le=d.sim,un=d.waterSim,je=d.worldTime}else{ji=new Uc(u.connect("headless"),Gt,{withOwnPlayer:!1});const p=[{op:"walkTo",x:8,z:48,timeout:120},{op:"walkTo",x:12,z:44,timeout:120},{op:"wait",ticks:60}];for(let _=0;_<$l;_++){const h=u.connect(`other${_}`),m=new gi(h,`other${_}`,new Ol(p,!0));m.setLightEdit(()=>{}),Dr.push(m),ws.push({transport:h,name:`other${_}`})}f=new gi(u.connect("me"),"me",xt);const g=f;Dr.push(g),g.setLightEdit((_,h,m)=>{pt==null||pt.edit(_,h,m)}),g.onPeerLeave(_=>{if(_!=="headless")return;Ft=null;const h=document.createElement("div");h.style.cssText="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font:600 24px sans-serif;z-index:9999;pointer-events:none;text-shadow:0 0 8px #000",h.textContent="host left",document.body.appendChild(h)}),Ge=g.world,le=g.sim,je=g.worldTime}pt=new zl(Ge,je),window.__lightDebug=pt,Ft=f,Ns=u,bs(),requestAnimationFrame(As);return}const e=wM(location.search);if(e){const u=await Ot.loadReplay(e);if(u){for(const f of u.snapshot.chunks){Yr(Ge,f);const d=Ge.getChunk(f.cx,f.cy,f.cz);d&&(un.restore(d),pt.load(f.cx,f.cy,f.cz),jn.add(it(f.cx,f.cy,f.cz)))}if(le.rng.restore(u.simPrng),je.restore(u.snapshot.meta.time),Jf=f=>new EM(u.intents.filter(d=>d.entityId===f.id)),le.restoreEntities(u.snapshot.meta.entities,Jf),le.ghostId=((s=le.all().find(f=>f.kind.id==="spectator"))==null?void 0:s.id)??0,le.ghostId===0){const f=le.viewed()??le.all()[0];le.ghostId=le.spawn({x:f.pos.x,y:f.pos.y+4,z:f.pos.z},new jt,{kindId:"spectator",baseController:new jt}).id}if(le.setViewed(u.snapshot.meta.viewedEntityId),!le.viewed()){const f=le.all().find(d=>d.kind.id==="player");le.setViewed(f?f.id:le.ghostId)}{const f=le.viewed();f&&xt.setLook(f.yaw,f.pitch)}It={replay:u,paused:!1},console.log(`[replay] loaded ${u.intents.length} deltas, playing ${u.startTick}..${u.endTick}`),bs(),requestAnimationFrame(As);return}console.warn(`[replay] not found: ${e} — starting a fresh world instead`)}for(let u=0;u<=4;u++){let f=Ot.syncRecord(0,u,2);if(f||(f=await Ot.fetchRecord(0,u,2)),f)Yr(Ge,f,le,em),Ps(Ge,0,u,2,0,2),un.restore(Ge.getChunk(0,u,2)),pt.load(0,u,2),jn.add(it(0,u,2));else{const d=new hu(Gt);pu(Ge,d,0,u,2),pt.load(0,u,2),jn.add(it(0,u,2))}}const t=6,i=46;let r=79;for(;r>=0&&!Mn(Ge.getBlock(t,r,i));)r--;if(di=new W(t+.5,r+1,i+.5),le.respawn={x:di.x,y:di.y,z:di.z},n){je.restore(n.time);const u=d=>d.id===n.viewedEntityId?xt:d.kindId==="deer"||d.kindId==="dolt"?new Va((p,g,_)=>Ge.getBlock(p,g,_),()=>le.rng.next()):new jt;le.restoreEntities(n.entities,u),le.setViewed(n.viewedEntityId);const f=le.entities.get(n.viewedEntityId);if(f&&f.kind.id==="player"&&(f.baseController=new jt),le.homeId=((o=le.all().find(d=>d.kind.id==="player"))==null?void 0:o.id)??0,le.ghostId=((a=le.all().find(d=>d.kind.id==="spectator"))==null?void 0:a.id)??0,le.ghostId===0){const d=le.viewed();le.ghostId=le.spawn({x:d.pos.x,y:d.pos.y+4,z:d.pos.z},new jt,{kindId:"spectator",baseController:new jt}).id}if(n.simPrng!==void 0&&le.rng.restore(n.simPrng),((l=(c=n.hotbar)==null?void 0:c.slots)==null?void 0:l.length)===9){for(let d=0;d<9;d++)gt.setSlot(d,n.hotbar.slots[d]);gt.select(n.hotbar.selected??0),ro.forEach((d,p)=>d.classList.toggle("sel",p===gt.selected)),Iu(gt.block)}}else{const u=le.spawn(di,xt,{yaw:-Math.PI/2,kindId:"player",baseController:new jt});le.setViewed(u.id),le.homeId=u.id,le.ghostId=le.spawn({x:di.x,y:di.y+4,z:di.z},new jt,{kindId:"spectator",baseController:new jt}).id,gt.select(Ka.indexOf(Z.Planks))}{const u=le.viewed();u&&xt.setLook(u.yaw,u.pitch)}if(zr){xt.frozen=!0;const u=le.viewed();u&&(u.noclip=!0)}Rt=zr?new mS({seed:Gt,phase:n?je.dayPhase:Zp,render:!Jp,anchor:{x:le.viewed().pos.x,y:le.viewed().pos.y,z:le.viewed().pos.z}}):null,bs(),requestAnimationFrame(As)}const nm=n=>{console.error(n),$p("Boot failed",String(n instanceof Error?n.message:n))},yb=window.setTimeout(()=>{console.log("[persistence] boot gate: IDB stalled past 5 s — starting a fresh world (any late meta is dropped)"),tm(null).catch(nm)},5e3);Ot.boot().then(n=>{window.clearTimeout(yb),tm(n).catch(nm)});const Ua={};for(const[n,e]of Object.entries(YS))Ua[n]=new Ai({map:ep(e,24301)});const Zi=new Map,th=new Map,Qo=new Map;function xb(n){let e=th.get(n);if(!e){const t=document.createElement("canvas");t.width=256,t.height=64;const i=t.getContext("2d");i.font="bold 40px sans-serif",i.textAlign="center",i.textBaseline="middle",i.fillStyle="rgba(0,0,0,0.55)",i.fillRect(0,0,256,64),i.fillStyle="#fff",i.fillText(n.slice(0,14),128,34),e=new $r(t),th.set(n,e)}return e}const Sb=document.getElementById("kind");function Mb(n){var t;const e=new Set;for(const i of le.all()){if(e.add(i.id),i.kind.collides===!1)continue;let r=Zi.get(i.id);if(!r){const s=Ua[i.kind.id]??(Ua[i.kind.id]=new Ai({map:ep(8947848,24301)})),o=jS(i.kind,s);if(!o)continue;r={rig:o,anim:GS()},Zi.set(i.id,r),Zt.add(o.root)}if(WS(r.anim,i,n,KS[i.kind.id]??4),ZS(r.rig,i,r.anim),r.rig.root.visible=i.id!==le.viewedId,i.name){let s=Qo.get(i.id);s||(s=new Il(new Sa({map:xb(i.name),depthTest:!1})),s.scale.set(1.6,.4,1),Zt.add(s),Qo.set(i.id,s)),s.position.set(i.pos.x,i.pos.y+1.8,i.pos.z),s.visible=i.id!==le.viewedId}}for(const[i,r]of Zi)e.has(i)||(Zt.remove(r.rig.root),Zi.delete(i));for(const[i,r]of Qo)e.has(i)||(Zt.remove(r),(t=r.material.map)==null||t.dispose(),Qo.delete(i))}function Eb(){const n=le.viewed();Sb.textContent=n?`viewing: ${n.kind.id}`:"",Lu.classList.toggle("hidden",!n||!n.kind.canEdit),Jr?(Yc.classList.remove("hidden"),jf.textContent="● recording… (R to stop)",Yl.classList.add("hidden")):It?(Yc.classList.remove("hidden"),jf.textContent=`replay ${It.paused?"⏸ paused":"▶ playing"}   t ${je.tick} / ${It.replay.endTick}`,Yl.classList.remove("hidden")):Yc.classList.add("hidden")}const qs=new Map,wb=3,Ln=new Set,jn=new Set,xn=new fS,ua=(n,e,t)=>Ge.getLight(n,e,t);function nh(n,e,t,i){const r=n[0]-e,s=n[2]-i;return(r*r+s*s)*100+Math.abs(n[1]-t)}function Kl(n,e,t,i){const r=it(n,e,t),s=qs.get(r);for(const c of[s==null?void 0:s.opaque,s==null?void 0:s.trans])c&&(Zt.remove(c),c.geometry.dispose());const o={opaque:null,trans:null};i.opaque&&(o.opaque=new Wt(rf(i.opaque),Ru)),i.trans&&(o.trans=new Wt(rf(i.trans),Cu)),o.opaque&&Zt.add(o.opaque),o.trans&&Zt.add(o.trans),qs.set(r,o);const a=Ge.getChunk(n,e,t);a&&(a.dirty=!1)}function ih(n,e,t){xn.cancel(it(n,e,t)),Kl(n,e,t,oS(Ge,n,e,t,ua))}function bb(n,e,t){xn.cancel(it(n,e,t));const i=it(n,e,t),r=qs.get(i);for(const s of[r==null?void 0:r.opaque,r==null?void 0:r.trans])s&&(Zt.remove(s),s.geometry.dispose());qs.delete(i)}let Rt=null,rh=0;Vt.rotation.order="YXZ";function bs(){const n=le.viewed();if(n)if(Vt.position.set(n.pos.x,n.pos.y+n.kind.eye,n.pos.z),Ft instanceof gi){const e=xt.getLook();Vt.rotation.set(e.pitch,e.yaw,0)}else Vt.rotation.set(n.pitch,n.yaw,0)}new URLSearchParams(location.search).has("dbg")&&(window.__bw={renderer:Rn,scene:Zt,camera:Vt});const Ya=new Set,xt=new Qh(Ya,0,0);window.addEventListener("keydown",n=>{if(n.target instanceof HTMLInputElement||n.target instanceof HTMLTextAreaElement||(Ya.add(n.code),n.repeat)||pn&&!(n.code==="KeyE"||n.code==="KeyH"||n.code==="KeyM"||n.code==="KeyR"))return;n.code==="KeyF"&&xt.toggleFly(),n.code==="KeyN"&&xt.toggleNoclip(),n.code==="KeyR"&&(Jr?(Db(),lm()):Vb()),n.code==="KeyE"&&Bb(),n.code==="KeyH"&&zb(),n.code==="KeyM"&&Gb(),n.code==="KeyC"&&Yb(!fm),n.code==="KeyP"&&Pb();const e=n.code.startsWith("Digit")?n.code.slice(5):n.code.startsWith("Numpad")?n.code.slice(6):"";if(e>="1"&&e<="9"){const t=Number(e)-1;gt.select(t),xt.select(t)}});window.addEventListener("keyup",n=>Ya.delete(n.code));Rn.domElement.addEventListener("click",()=>{hn?sm():en?om():tn?Du():pn?cm():co()});const Tb=document.getElementById("crosshair");document.addEventListener("pointerlockchange",()=>{const n=document.pointerLockElement===Rn.domElement;Tb.style.display=n?"block":"none",n||Ya.clear()});document.addEventListener("mousemove",n=>{document.pointerLockElement===Rn.domElement&&xt.mouse(n.movementX,n.movementY)});const qn=new Cx(new Lx(new sr(1.002,1.002,1.002)),new zh({color:16777215}));qn.visible=!1;Zt.add(qn);let jl=!1;document.addEventListener("pointerlockchange",()=>{jl=document.pointerLockElement===Rn.domElement,jl?(document.addEventListener("mousedown",oh),document.addEventListener("contextmenu",sh)):(document.removeEventListener("mousedown",oh),document.removeEventListener("contextmenu",sh),qn.visible=!1)});function sh(n){n.preventDefault()}function Ab(n,e,t){const i=xe(n),r=xe(e),s=xe(t);ih(i,r,s);const o=n-i*Je,a=e-r*Je,c=t-s*Je,l=[];o===0&&l.push([i-1,r,s]),o===Je-1&&l.push([i+1,r,s]),c===0&&l.push([i,r,s-1]),c===Je-1&&l.push([i,r,s+1]),a===0&&l.push([i,r-1,s]),a===Je-1&&l.push([i,r+1,s]);for(const[u,f,d]of l)Ge.hasChunk(u,f,d)&&ih(u,f,d)}function oh(n){n.button===0?xt.primary():n.button===2&&xt.secondary()}function Rb(){const n=le.viewed();return n?Fl(Ge,Qs(n),Os(n.yaw,n.pitch),ks,Zh(Ge,Da)):null}function Cb(){if(!jl){qn.visible=!1;return}const n=le.viewed();if(!n){qn.visible=!1;return}if(Kh(Qs(n),Os(n.yaw,n.pitch),le.all().filter(i=>i.id!==n.id),ks)){qn.visible=!1;return}const t=Rb();if(!t){qn.visible=!1;return}qn.position.set(t.x+.5,t.y+.5,t.z+.5),qn.visible=!0}function Pb(){const n=le.viewed();if(!n)return;const e=OS(le,xt),t=Kh(Qs(n),Os(n.yaw,n.pitch),e,ks);kS(le,xt,t?e[t.index].id:null),Jr&&mi&&mi.onViewed(je.tick,le.viewedId)}function Lb(){return{chunks:[...Ge.allChunks()].map(n=>hi(n)),meta:{v:2,seed:Gt,entities:le.all().map(n=>le.toRecord(n)),viewedEntityId:le.viewedId,time:je.snapshot(),hotbar:{slots:[...gt.slots],selected:gt.selected},simPrng:le.rng.state()}}}let da=0,im=0,fa=null;function Ib(){da=je.tick,im=le.rng.state(),fa=Lb();const n=new rp(da);n.attach(le),mi=n,Jr=!0,It=null,console.log(`[replay] recording from tick ${da} (R to stop)`)}function Db(){if(!mi||!Jr||!fa)return;const n={seed:Gt,startTick:da,endTick:je.tick,simPrng:im,events:mi.events,intents:mi.intents,viewed:mi.viewed,recordedAt:Date.now(),snapshot:fa},e=`${Gt}:replay:${n.startTick}`;Ot.saveReplay(e,n),le.onIntent=le.onSpawn=le.onDespawn=void 0,mi=null,Jr=!1,fa=null,console.log(`[replay] saved ${e} — ${n.intents.length} intents, ${n.events.length} events (replay with ?replay=${e})`)}const Ka=[...Ix],gt=new Yx(Ka),Ub=no.toDataURL();function Pu(n,e,t){n.style.backgroundImage=`url(${Ub})`,n.style.backgroundSize=`${t*16}px ${t*16}px`,n.style.backgroundPosition=Ux(e,t),n.title=ei[e].name}const Lu=document.getElementById("hotbar"),ns=document.getElementById("palette"),ro=Array.from(Lu.children),Nb=Ka.map(n=>{const e=document.createElement("div");e.className="slot";const t=document.createElement("div");t.className="icon",Pu(t,n,40);const i=document.createElement("span");return i.className="name",i.textContent=ei[n].name,e.append(t,i),e.addEventListener("click",()=>gt.setSlot(gt.selected,n)),ns.append(e),e}),Iu=n=>{Nb.forEach((e,t)=>e.classList.toggle("sel",Ka[t]===n))};ro.forEach((n,e)=>Pu(n,gt.slots[e],40));Lu.classList.remove("hidden");ro.forEach((n,e)=>{const t=document.createElement("span");t.className="num",t.textContent=String(e+1),n.append(t)});gt.onSelectChange=n=>{ro.forEach((e,t)=>e.classList.toggle("sel",t===n)),Iu(gt.block)};gt.onSlotChange=n=>{Pu(ro[n],gt.slots[n],40),Iu(gt.block)};let hn=!1,en=!1,tn=!1,pn=!1;const so=document.getElementById("help"),rm=document.getElementById("help-hint"),oo=document.getElementById("replays"),jc=document.getElementById("replays-list"),Fb=document.getElementById("replays-record"),ao=document.getElementById("mp-menu"),Na=document.getElementById("mp-name"),kb=document.getElementById("mp-code"),Zl=document.getElementById("mp-error");function co(){const n=Rn.domElement.requestPointerLock();n instanceof Promise&&n.catch(()=>{})}function Ri(){rm.classList.toggle("hidden",hn||en||tn||pn)}function sm(){ns.classList.add("hidden"),hn=!1,Ri(),co()}function Ob(){en&&(en=!1,so.classList.add("hidden")),tn&&(tn=!1,oo.classList.add("hidden")),pn&&(pn=!1,ao.classList.add("hidden")),hn=!0,ns.classList.remove("hidden"),Ri(),document.exitPointerLock()}function om(){so.classList.add("hidden"),en=!1,Ri(),co()}function am(){hn&&(hn=!1,ns.classList.add("hidden")),tn&&(tn=!1,oo.classList.add("hidden")),pn&&(pn=!1,ao.classList.add("hidden")),en=!0,so.classList.remove("hidden"),Ri(),document.exitPointerLock()}function Bb(){hn?sm():Ob()}function zb(){en?om():am()}function cm(){ao.classList.add("hidden"),pn=!1,Ri(),co()}function Hb(){hn&&(hn=!1,ns.classList.add("hidden")),en&&(en=!1,so.classList.add("hidden")),tn&&(tn=!1,oo.classList.add("hidden")),pn=!0,ao.classList.remove("hidden"),Na.value=localStorage.getItem("bw.name")??"",Zl.classList.add("hidden"),Ri(),document.exitPointerLock(),Na.focus()}function Gb(){if(pn){cm();return}Ft||It||Hb()}document.getElementById("mp-host").addEventListener("click",()=>{location.href=`?host&name=${encodeURIComponent(Na.value)}`});document.getElementById("mp-join").addEventListener("click",()=>{const n=kb.value.trim().toLowerCase();if(n===""){Zl.textContent="paste the room code the host shows",Zl.classList.remove("hidden");return}location.href=`?join=${encodeURIComponent(n)}&name=${encodeURIComponent(Na.value)}`});function lm(){hn&&(hn=!1,ns.classList.add("hidden")),en&&(en=!1,so.classList.add("hidden")),pn&&(pn=!1,ao.classList.add("hidden")),tn=!0,oo.classList.remove("hidden"),Ri(),document.exitPointerLock(),Wb()}function Du(){oo.classList.add("hidden"),tn=!1,Ri(),co()}function Vb(){tn?Du():lm()}function Wb(){Ot.listReplays().then(n=>{tn&&Xb(n)})}function Xb(n){if(jc.replaceChildren(),n.length===0){const t=document.createElement("div");t.className="empty",t.textContent="no recordings yet — press R, then record something",jc.append(t);return}const e=[...n].sort((t,i)=>(i.recordedAt??0)-(t.recordedAt??0));for(const t of e){const i=`${t.seed}:replay:${t.startTick}`,r=document.createElement("div");r.className="row";const s=document.createElement("span");s.className="when",s.textContent=t.recordedAt?new Date(t.recordedAt).toLocaleString():"—";const o=document.createElement("span");o.className="len",o.textContent=`${((t.endTick-t.startTick)*Ts).toFixed(1)} s`;const a=document.createElement("span");a.className="tick",a.textContent=`#${t.startTick}`,r.append(s,o,a),r.addEventListener("click",()=>{const c=new URL(location.href);c.searchParams.set("replay",i),location.href=c.toString()}),jc.append(r)}}Fb.addEventListener("click",()=>{Ib(),Du()});rm.addEventListener("click",()=>{en||am()});window.addEventListener("wheel",n=>{hn||en||tn||(gt.cycle(n.deltaY>0?1:-1),xt.select(gt.selected))},{passive:!0});function qb(){const n=le.viewed();if(!n)return;const e=xe(n.pos.x),t=xe(n.pos.z),i=xe(n.pos.y),r=mu(Ge,e,t,i,It?Zf:Ot,le);um(r,It?Zf:Ot,!1)}function um(n,e,t){const i=le.viewed(),r=i?xe(i.pos.x):0,s=i?xe(i.pos.z):0;for(const o of n.unloaded)if(bb(o.cx,o.cy,o.cz),pt.unload(o.cx,o.cy,o.cz),Ln.delete(it(o.cx,o.cy,o.cz)),jn.delete(it(o.cx,o.cy,o.cz)),!t)for(const a of le.entitiesInChunk(o.cx,o.cy,o.cz))(a.kind.id==="deer"||a.kind.id==="dolt")&&le.despawn(a.id);n.unloaded.length&&!It&&!t&&e.saveMeta(dm());for(const o of n.rebuilt)t||un.settle(o.cx,o.cy,o.cz),pt.load(o.cx,o.cy,o.cz),jn.add(it(o.cx,o.cy,o.cz));if(!t)for(const o of n.generated)HS(Ge,le,o.cx,o.cz);for(const o of n.restored){const a=Ge.getChunk(o.cx,o.cy,o.cz);t||un.restore(a),pt.load(o.cx,o.cy,o.cz),jn.add(it(o.cx,o.cy,o.cz))}for(const o of n.pending){const a=it(o.cx,o.cy,o.cz);Kc.has(a)||(Kc.add(a),e.fetchRecord(o.cx,o.cy,o.cz).then(c=>{if(Kc.delete(a),!c){e.dropPersisted(o.cx,o.cy,o.cz);return}if(!i||!$h(o.cx,o.cz,r,s)||Ge.hasChunk(o.cx,o.cy,o.cz))return;Yr(Ge,c,le,em),Ps(Ge,o.cx,o.cy,o.cz,r,s);const l=Ge.getChunk(o.cx,o.cy,o.cz);t||un.restore(l),pt.load(o.cx,o.cy,o.cz),jn.add(a)}))}}function dm(){return{v:2,seed:Gt,entities:le.all().map(n=>le.toRecord(n)),viewedEntityId:le.viewedId,simPrng:le.rng.state(),time:je.snapshot(),hotbar:{slots:[...gt.slots],selected:gt.selected}}}const Uu=()=>{It||(Ot.saveLoaded(Ge.allChunks(),dm()),Ot.flush())};document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Uu()});window.addEventListener("pagehide",()=>Uu());setInterval(()=>Uu(),5e3);let Fa="air";function $b(){const n=le.viewed(),e=n!=null&&n.headInWater?"water":"air";e!==Fa&&(Fa=e,Vt.fov=e==="water"?ub:lb,Vt.updateProjectionMatrix())}let fm=!1;function Yb(n){fm=n,Ru.wireframe=n,Cu.wireframe=n}const Ts=1/60,Kb=30,jb=1e3;let ah=performance.now(),Zc=0;function As(n){const e=zr?performance.now():0;let t=(n-ah)/1e3;ah=n,t>.1&&(t=.1),Zc+=t;const i=je.tick;for(xt.heldBlock=gt.block;Zc>=Ts;)if(Zc-=Ts,!(It&&It.paused)){if(Ft){for(const d of Dr)d.tick(je.tick);Ns==null||Ns.pump(je.tick),ji&&(ji.worldTime.tick=je.tick,ji.tick(je.tick)),je.advanceTick()}else le.tick(Ts,je.tick),je.advance(Ts);It&&(le.setViewed(bM(It.replay,je.tick)),je.tick>=It.replay.endTick&&(It.paused=!0))}if(Ft){const d=Ft.lastStream;d&&um(d,Ft.persist,Ft instanceof gi)}else qb();if(Rt){const d=Ge.getChunk(2,1,0),p=Rt.beginFrame({worstLoaded:d!==void 0,worstSettled:d!==void 0&&!Ln.has(Gi)&&!xn.has(Gi)}).waypoint,g=le.viewed();g&&(g.pos.x=p.x,g.pos.y=p.y,g.pos.z=p.z,g.vel={x:0,y:0,z:0})}pt.tick(xM),!(Ft instanceof gi)&&tM(i,je.tick,Kb)&&un.tick(jb);for(const d of un.touched)Ln.add(d);un.touched.clear();for(const d of pt.touched)Ln.add(d);pt.touched.clear(),jn.forEach(d=>Ln.add(d)),jn.clear();const r=zr?performance.now():0,s=le.viewed(),o=xe((s==null?void 0:s.pos.x)??0),a=xe((s==null?void 0:s.pos.y)??0),c=xe((s==null?void 0:s.pos.z)??0),l=xn.inFlightKey();if(l){const[d,p,g]=l.split(",").map(Number);if(Ge.hasChunk(d,p,g)){const _=xn.advance(l),h=Jd(Ge,d,p,g,ua,_[0],_[1]);xn.store(l,h);const m=xn.finish(l);m?(Kl(d,p,g,m),l===Gi&&(Rt==null||Rt.noteRemesh("merge",Wo(m)))):l===Gi&&(Rt==null||Rt.noteRemesh("slice",Wo(h)))}else xn.cancel(l),Ln.delete(l)}else if(Ln.size){const d=[...Ln].map(p=>p.split(",").map(Number));d.sort((p,g)=>nh(p,o,a,c)-nh(g,o,a,c));for(const[p,g,_]of d.slice(0,wb)){const h=`${p},${g},${_}`;if(!Ge.hasChunk(p,g,_)){Ln.delete(h);continue}const m=aS(Ge,p,g,_,ua,cS);if(Ln.delete(h),m.complete)Kl(p,g,_,m.mesh),h===Gi&&(Rt==null||Rt.noteRemesh("probe-complete",Wo(m.mesh)));else{xn.start(h,uS(Ge.getChunk(p,g,_),lS));const[v,y]=xn.advance(h),S=Jd(Ge,p,g,_,ua,v,y);xn.store(h,S),h===Gi&&(Rt==null||Rt.noteRemesh("plan",Wo(S)));break}}}rh=zr?performance.now()-r:0,Ft instanceof gi&&Ft.syncPoses(),bs(),Cb(),Mb(t),Eb(),$b(),Yf.setVisible(Fa==="air");const u=iM(je.dayPhase);mb.apply(u,Fa,Vt);for(const d of Kp)d.value=u.dayness;for(const d of Object.values(Ua))d.color.setScalar(Bl+(1-Bl)*u.dayness);Yf.update(Vt.position.x,Vt.position.z,Vt.position.y,je.time,u.worldDim);const f=eM(je.day,je.hour);if(f!==Kf&&(Kf=f,gb.textContent=f),Jp||Rn.render(Zt,Vt),Rt){const d=Rt.noteFrame(performance.now()-e,rh);d&&(console.log("PROF-RESULT "+JSON.stringify(d)),window.__profResult=d)}if(Hr&&Kn==="client"&&!Qf&&je.tick>=250&&ws.length>1&&(Qf=!0,ws[1].transport.disconnect()),Hr&&Kn==="host"){Bi||(Bi=new Map);for(const d of le.all())d.kind.id!=="player"||d.id===le.viewedId||Bi.has(d.id)||Bi.set(d.id,{x:d.pos.x,z:d.pos.z})}if(Hr&&je.tick>=300&&window.__mpResult===void 0){const d={mode:Kn,tick:je.tick,bots:$l};if(Kn==="host"){d.rigCount=Zi.size,d.remotePlayers=le.all().filter(h=>h.kind.id==="player"&&h.id!==le.viewedId).map(h=>{const m=Bi==null?void 0:Bi.get(h.id),v=m?Math.hypot(h.pos.x-m.x,h.pos.z-m.z)>.25:!1;return{id:h.id,x:Math.round(h.pos.x*10)/10,y:Math.round(h.pos.y*10)/10,z:Math.round(h.pos.z*10)/10,name:h.name??null,moved:v}});const p=10,g=40,_=10;Ge.setBlock(p,g,_,Z.Planks),d.editReflected=Ge.getBlock(p,g,_)===Z.Planks}else{d.rigCount=Zi.size,d.otherPlayers=le.all().filter(g=>g.kind.id==="player"&&g.id!==le.viewedId).map(g=>({id:g.id,x:Math.round(g.pos.x*10)/10,y:Math.round(g.pos.y*10)/10,z:Math.round(g.pos.z*10)/10,name:g.name??null}));const p=le.viewed();d.camera=p?{x:Math.round(p.pos.x*10)/10,y:Math.round(p.pos.y*10)/10,z:Math.round(p.pos.z*10)/10}:null,d.clientMeshedChunks=qs.size,d.headlessHostMeshedChunks=0,d.leaveRigRemoved=ws.length>1?Zi.size<ws.length+1:!0}console.log("MP-RESULT "+JSON.stringify(d)),window.__mpResult=d}requestAnimationFrame(As)}
