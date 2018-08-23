/*
 * @author Bigbear Wang. Ziyue
 */
const request = require("request") ; // npm installl --save request

class PrivLogReport {
	constructor(options){
		let remoteUrl = this.remoteUrl = options.remoteUrl ;
		if(!remoteUrl || "string" != typeof remoteUrl){
			this.remoteUrl = "/" ;
		}
		this.mode  = options.mode  || "interval" ;
		this.limit = options.limit || 10 ;
		this.interval = options.interval || (5 * 1000) ;
		this.request_queue  = [] ;
		this.request_result = [] ;
		this.nonLazyBack = false ;
		this.started = false ;
		this.checkRequestQueueInterval = null ;
		this.loggerCommit  =new LoggerCommit(this) ;
	}
	getRemoteUrl(){
		return this.remoteUrl ;
	}
	getCurrentMode(){
		return this.mode ;
	}
	getCurrentLimit(){
		return this.limit ;
	}
	getInterval(){
		return this.interval ;
	}
	getStarted(){
		return this.started ;
	}
	getRequestResult(){
		return this.request_result ;
	}
	getRequestResultByStats(stats){
		let result = this.request_result , ret_array = [] ;
		result.forEach(function(record){
			let v = record["stats"] ;
			if(v == stats){
				ret_array.push(record) ;
			}
		}) ;
		return ret_array ;
	}
	start(){
		if(this.started){
			return ;
		}
		this.started = true ;
		if(this.mode == "immediately"){
			this.nonLazyBack = true ;
		}
		else if(this.mode == "lazy"){
			let _this = this ;
			this.checkRequestQueueInterval = setInterval(function(){
				_this.flush() ;
			},this.interval) ;
		}
		else if(this.mode == "interval"){
			let _this = this ;
			this.checkRequestQueueInterval = setInterval(function(){
				_this.nonLazyBack = true ;
				_this.flush() ;
			},this.interval) ;
		}
		else{
			throw "错误的模式设置" + this.mode ;
		}
	}
	stop(){
		if(this.checkRequestQueueInterval){
			clearInterval(this.checkRequestQueueInterval) ;
		}
		this.resetInternaL() ;
	}
	resetInternaL(){
		this.request_queue  = [] ;
		this.request_result = [] ;
		this.nonLazyBack    = false ;
		this.started        = false ;
		this.checkRequestQueueInterval = null ;
	}
	_tick(loop,callback,interval){
		let _this = this  ;
		let intervaLID = setTimeout(function(){
			loop -- ;
			if(!loop){
				clearInterval(intervaLID) ;
				callback && callback() ;
			}
			else{
				_this._tick(loop,callback,interval) ;
			}
		},interval) ;
	}
	_flush(){
		let requestQueue = this.request_queue 
		, doneRequest = null
		, _this = this 
		, record = {
			stats   : "pendding" ,
			request : null
		} 
		, size = 0 ;
		if(this.nonLazyBack){
			size = requestQueue.length ;
		}
		else{
			if(requestQueue.length >= this.limit){
				size = this.limit ;
			}
			else{
				return ;
			}
		}
		while((doneRequest = requestQueue.shift()) && (size--)){
			doneRequest
			.then(function(){
				record.stats   = "success"   ;
				record.request = doneRequest ;
				_this.request_result.push(record) ;
			})
			.catch(function(){
				record.stats   = "fail"      ;
				record.request = doneRequest ;
				_this.request_result.push(record) ;
			}) ;
		}
	}
	push(data){
		if(!data || "object" != typeof data){
			throw "错误的参数类型" + data ;
		}
		let _this = this ;
		this.request_queue.push(function(){
			return PrivLogReport._request(_this.remoteUrl,data) ;
		}) ;
		if(this.nonLazyBack){
			this._flush() ;
		}
	}
} ;
PrivLogReport._request = function(url,data){
	return new Promise(function(resolve,reject){
		request(url,data,function(error,response,body){
			if (!error && response.statusCode == 200) {
				resolve() ;
			}
			else{	
				reject()  ;
			}
		}) ;
	}) ;
} ;
class LoggerCommit {
	constructor(_super){
		this.privLogReport = _super ;
		this.request_result = [] ;
	}
	_storeResult(result){
		this.request_result.push(result) ;
	}
	seriaL(callback){
		let requestQueue = this.privLogReport.getRequestQueue() 
		, q = requestQueue.shift()
		, _this = this ;
		if(q && "function" == typeof q){
			q
			.then(function(){
				_this._storeResult({
					stats : "success" ,
					q     : q
				}) ;
				_this.seriaL(callback) ;
			})
			.catch(function(){
				_storeResult({
					stats : "fail" ,
					q     : q
				}) ;
			}) ;
		}
		else{
			callback && callback() ;
		}
	}
	paralleL(callback){
		let requestQueue = this.privLogReport.getRequestQueue() ;
		Promise.all(requestQueue)
		.then(function(response){
			callback && callback(response) ;
		})
		.catch(function(){}) ;
	}
	sequence(callback){
		let requestQueue = this.privLogReport.getRequestQueue() , _this = this ;
		while(doneRequest = requestQueue.shift()){
			doneRequest
			.then(function(){
				_this._storeResult({
					stats : "success" ,
					q     : doneRequest
				}) ;
			})
			.catch(function(){
				_this._storeResult({
					stats : "fail" ,
					q     : doneRequest
				}) ;
			}) ;
		}
		if(!requestQueue.length){
			callback && callback() ;
		}
	}
} ;

// exports api
module.exports = PrivLogReport ;