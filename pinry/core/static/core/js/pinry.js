//Global Variables
var apiURL = '/api/v1/'
var pinsURL = apiURL+'pin/?format=json&offset='
var pinURL = apiURL+'pin/'
var cmntURL = apiURL+'cmnt/'
//var favsURL = apiURL+'favs/?format=json&'
var userURL = apiURL+'auth/user/?format=json'
var page = 0;
var handler = null;
var handlerT = null;
var cTag = null;//used to track current tag
var cTags = null;//not used yet for list of current tag filters
var cUser = null;//used to track current user
var isLoading = false;
var pinsPrefix = ""; //url required for access to pins url's (defined in pinry.urls for include: pinry.pins.urls)
var apiPrefixA = ["user", "profile"];//prefix for recent-pins (defined in pins.urls recent-pins) determines when to use pins api in below funcions
var aProfile = $('.pin.profile');
var aProfileO = {username:aProfile.attr('data-profile')};
//var aProfileU = aProfile.attr('data-profile');
var pinA = [];
var origin = window.location.origin;
console.warn(origin);
var av=url(3);//active view
var authUserO = ajax(userURL, false);//authenticated user object//used to determine current authenticated user
var aOptions //tracks active pin options floater for touch devices
var vn = { //viewname:"displayname"
	favs:"Favorites",
	tags:"Groups",
	pins:"Pins",
	fing:"Spying",
	fers:"Stalked",
	cmnts:"Notes",
	pop:"Popular"
}

//TEST FOR TOUCH DEVICE
function is_touch_device() {
	return !!('ontouchstart' in window) // works on most browsers 
	|| !!('onmsgesturechange' in window); // works on ie10)
};

/** generic function for ajax calls:
 *url: url to make ajax call
 *async: Boolien false makes non async call, Defaults to true
 *cbS: name of function to call on ajax success
 *cbE: name of function to call on ajax error
 *reqType: default='GET'
 */

function ajax(url, async, reqType, cbS, cbE, data){
	if (async == undefined) async = true;
	if (reqType == undefined) reqType = 'GET';
	var rData

	onApiData = function( data, textStatus, XMLHttpRequest) {
		console.warn(textStatus)
		var loc = XMLHttpRequest.getAllResponseHeaders();
		console.warn(loc)
		//if callback exicute call back
		if (cbS){
			cbS()
		//if data.objects are returned return just the bojects
		}else if(data.objects){
				console.warn('data.objects[0] returned below:')
				console.warn(data.objects[0])
				rData = data.objects[0]
		//return all data
		}else{
			rData = data
			console.log('data w/o objects returned below:')
			console.log(rData)
			if (authUserO && authUserO.username == aProfileO.username || !aProfileO.username){
				console.log('----reloading data after ajax')
				loadData(undefined, undefined, true)//reloads data
				
			}
		}
	}
	console.warn('-ajax - 1 custom ajax()');
	$.ajax({//1 custom ajax function
		url: url,
		type: reqType,
		contentType: 'application/json',
		data: data,
		dataType: 'json',
		processData: false,
		headers:  {
			//'x-requested-with' : 'XMLHttpRequest' //// add header for django form.is_valid() 
		},
		xhrFields: {
			//withCredentials: true //// add credentials to the request
		},
		/* beforeSend: function(jqXHR, settings) {
			//jqXHR.setRequestHeader('X-CSRFToken', $('input[name=csrfmiddlewaretoken]').val());
				//TODO: xcrf solution needed
		}, */
		success: $.proxy(onApiData, this.getApiData),
		//TODO: swap fav image
		error: function(jqXHR, settings) {
			if (cbE){cbE()}else{console.warn('ajax() - ajax error')};
		},
		async: async,
	});
	if (!cbS) return rData;
}

/**
 * Endless Scroll: Based on Wookmark's endless scroll.
 */

//TODO TEST: fix error with manual scroll jitter, better with below (possibly need to stop ajax calls when no data left via pages??
//TODO TEST: fix ios scroll to bottom not detected, may have fixed with $(window).bind

//When scrolled all the way to the bottom, add more tiles.
function onScroll(event) { 
  if(!isLoading) {
      var closeToBottom = ($(window).scrollTop() + $(window).height() > $(document).height() - 100);
      if(closeToBottom) loadData();
  }
};



//format pin grid and apply layout
function applyLayout() {
  $('#pins').imagesLoaded(function() {
      // Clear our previous layout handler.
      if(handler) handler.wookmarkClear();
      
      // Create a new layout handler.
      handler = $('#pins-container .pin');
      handler.wookmark({
          autoResize: true,
          offset: 4,
          itemWidth: 242
      });
	  $('#user-info').show();
  });
};
//apply layout to pin grid for tag/group covers
function layoutThumbs(target) {
  $(target+' .thumbs').imagesLoaded(function() {
      // Clear our previous layout handler.
      if(handlerT) handlerT.wookmarkClear();
      
      // Create a new layout handler.
      handlerT = $(target+' .thumb.board');
      handlerT.wookmark({
		  container: $(target),
          autoResize: true,
          offset: 2,
          itemWidth: 68
      });
  });
};

/**Loads data from the API. 
 * 
 * set tag / user to null to clear
 * set tag / user to undefined to keep current filters.
 */
function loadData(tag, user, reload) {
	if(typeof tag == "string"){tag = urlSafe(tag)}
	if (reload == undefined){reload = false};
    isLoading = true;
    $('#loader').show();
	console.log('----loadData()------tag:'+tag+' user: '+user)
	var apiPrefix = inArray(url(1), apiPrefixA);
	
	//check url for current user / tag
	if (url(2) && apiPrefix) {
		console.log('url(2)sets cUser to: '+url(2));
		cUser = url(2);
		var nAddress = '/'+apiPrefix+'/';
	}
	if (url(3) && apiPrefix) {
		console.log('url(3) sets cTag to : '+url(3));
		cTag = url(3);
    }else{
		cTag = null;
	}
	
	//check if new user or tag specifiled, if true set url to current except if null specified.
	if (user) {
		nAddress += user+'/';
		console.log('if user update url to: '+nAddress);
	}else if (cUser) {
		user = cUser;
		nAddress += user+'/';
		console.log('else if cUser update url to: '+nAddress);
	}
	if (tag){//*add support for multi tags with cTags, maybe peramiter url is better??
		nAddress += tag+'/';
		console.log('if tag update url to: '+nAddress);
	}else if (cTag && tag !== null){
		tag = cTag;
		nAddress += cTag+'/';
		console.log('else if cTag update url to: '+nAddress);
	}
	
	//add active tag to tag display div
	if (tag){
		$('#tags').show();
		$('#tags .tags').html('<span class="label tag" onclick="loadData(null)">' + displaySafe(tag) + ' x</span>');
	}else{
		$('#tags').hide();
	}
	
	//updated push state for back nav and current view name
	console.log('final url = '+nAddress);
	console.log('curren url(path) = '+url('path'));
	if (nAddress && nAddress != url('path')){
		window.history.pushState(nAddress, 'Pinry: '+nAddress, nAddress);
		console.log('PUSH STATE ADDED:'+nAddress);
		console.log('new url(path) = '+url('path'));
	}
	//if current tag has a view convert tag name to defined view
	av = getKey(tag, vn)
	/*debug
	console.log('tag = '+tag)
	console.log('cTag = '+cTag)
	console.log(tag !== undefined && tag !== cTag )
	console.log('user = '+user)
	console.log('cUser = '+cUser)
	console.log(user !== undefined && user !== cUser)
	console.log('av = '+av)
	console.log('av name = '+vn[av])
	console.log(vn[av] !== cTag)
	 */
	
	//reset page and refresh pins display
	if (reload || tag !== undefined && tag !== cTag || user !== undefined && user !== cUser || vn[av] !== undefined && vn[av] !== cTag){
		console.warn('page reset')
		page = 0;
		$('#pins').html('');
	}
	//make api url
	console.log('page: '+page);
    var loadURL = pinsURL;
	
	//if current tag has a view setup ajax for view
	console.log('active view set to:'+av);
	if (av == 'pop') {
		loadURL += (page*30)+"&pop&sort=popularity"
		//loadURL =pinURL+'?favorites__isnull=false&format=json&offset='+page*30
		tag = null
	}else if (av == 'favs') {
		loadURL += (page*30)+"&favs=" + user;
		tag = null
	}else if (av == 'tags') {
		loadURL += (page*500)
		tag = null
	}else{
		loadURL += (page*30)
	}
	console.log('final user: '+user);
	console.log('final tag: '+tag);
	if (user && user != 'all') loadURL += "&user=" + user;
    if (tag && tag !== null) loadURL += "&tag=" + tag;
	
	//prevent api request when not in apiPrefix domain
	if (url(1) == apiPrefix) {
		console.warn('-ajax - 2 loaddata()');
		$.ajax({//2 load data
			url: loadURL,
			contentType: 'application/json',
			/* headers:  {
				'x-requested-with' : 'XMLHttpRequest' //// add header for django form.is_valid() 
			},
			beforeSend: function(jqXHR, settings) {
				jqXHR.setRequestHeader('X-CSRFToken', $('input[name=csrfmiddlewaretoken]').val());
			}, */
			success: onLoadData,
			error: function(jqXHR, settings) {
				console.warn('ladData - ajax error');
			},
		});
	}
};

/** Reloads page on state change 
 * 
 */
window.onpopstate = function(e) {
	console.log('pop state: '+e.state);
	//alert("location: " + document.location + ", state: " + JSON.stringify(event.state));
	if (e.state) window.location.href = e.state;
};

/**Receives data from the API, creates HTML for images and updates the layout
 * 
 */

function onLoadData(data) {
	data = data.objects;
	page++;
	var maxImages = 10 //max images to include on tag/group pin flow cover
	var minImages = 7 //min images to include on tag/group pin flow cover
	var tags = {}
	var i=0, length=data.length, image;
	for(; i<length; i++) {
		image = data[i];
		var html = '';
		var userFav = false
		var userPin = false
		var userCmnt = false
		//layout for all views except for those listed below
		if (av != 'tags'){
			console.log('-loadData-av != tags')
			
			//package pin data for js access(req for repin)
			pinA[image.id] = {
				srcUrl:image.srcUrl,
				imgUrl:image.imgUrl,//CHECK: this was changed from origin+image.image, if it works we dont need origin
				//the origin did not work with heroku due to amazon
				//thumbnail:origin+image.image,
				repin:'/api/v1/pin/'+image.id+'/',//:TODO: this may need to be just id or pin object???
			};
			
			if (authUserO){
				for (f in image.favorites){
					if (image.favorites[f].user.id == authUserO.id){
						userFav = true;
					}
				}
				for (f in image.comments){
					if (image.comments[f].user_id == authUserO.id){
						userCmnt = true;
					}
				}
				console
				if (image.submitter.id == authUserO.id){
					userPin = true
				}
			}
			//SETUP HTML FOR LARGE PINS DISPLAY
			html += '<div class="pin image touch-off" id="'+image.id+'-pin" data-favs="'+image.favorites.length+'" data-cmnts="'+image.comments.length+'">';
				//OPTIONS
				if (authUserO){
				html += '<div class="pin-options-btn touch-off hide"><i id="options-btn" class="icon-cog"data-state="false" title="Show Options"></i></div>';
				html += '<div class="pin-options">';
					html += '<a href="'+pinsPrefix+'/delete-pin/'+image.id+'/">';
					html += '<i id="delete-btn" title="Delete" class="icon-trash"></i>';
					html += '</a>';
					html += '<a href="'+pinsPrefix+'/edit-pin/'+image.id+'/">';
						html += '<i id="edit-btn" title="Edit" class="icon-edit"></i>';
					html += '</a>';
					if (userFav) {
						html += '<i id="favs" data-state="'+userFav+'" title="Remove Favorite" class="icon-star"></i>';
					} else {
						html += '<i id="favs" data-state="'+userFav+'" title="Add Favorite" class="icon-star-empty"></i>';
					};
					html += '<i id="repins" data-state="'+userPin+'" title="Re-Pin" class="icon-plus"></i>';
					html += '<i id="cmnts" data-state="false" title="Comment" class="icon-chat"></i>';
				html += '</div>';
				}
				//IMAGE
				html += '<a class="fancybox" rel="pins" href="'+image.image+'">';
					html += '<img src="'+image.thumbnail+'" width="200" >';
				html += '</a>';
				//INFO / STATS
				html += '<div class="pin-info">';
					html += '<l><span class="">From: </span>'
					html += '<a class="pin-src" rel="pins" title="Source" href="'+image.srcUrl+'">'+getHost(image.srcUrl)+'</a></l>';
					html += '<l><span class="">By: </span>'
					html += '<a class="pin-submitter" title="User\'s pins" href="/user/'+image.submitter.username+'/">'+image.submitter.username+'</a></l>';
				html += '</div>';
				html +='<div class="pin-stats pull-right">'
						html += '<i class="display icon favs"></i><span class="display text light favs ">'+image.favorites.length+'</span>';
						html += '<i class="display icon cmnts"></i><span class="display text light cmnts ">'+image.comments.length+'</span>';
				html +='</div>'
				//DESCRIPTION
				html += '<div class="pin-desc">';
					if (image.description) html += '<p id="desc">'+image.description+'</p>';
				html += '</div>';
				//TAGS
				html += '<div class="pin-tags section">';
				if (image.tags) {
					html += '<l>';
					html += '<span>Groups: </span>'
					for (tag in image.tags) {
						html += '<span class="tag" onclick="loadData(\'' + image.tags[tag] + '\')">' + image.tags[tag] + '</span> ';
					}
					html += '</l>';
				}
				html += '</div>';
				//COMMENTS     TODO:Change api name to CmntsResource not Comnts
				if (authUserO){
					html += '<div class="section pin-cmnts">';
						//FORM inserted by click
						 
						//CMNTS
						if (image.comments){ 
							for (cmnt in image.comments) {
								//TODO: try to get user object from CmntResource instead or build one so user vars are consistant.
								console.log(image.comments[cmnt])
								html += insertComment(image.comments[cmnt].user.username, image.comments[cmnt].user.id, image.comments[cmnt].comment, parseInt(image.comments[cmnt].id))
							}
						}
					}
				html += '</div>'//end pin-cmnts;
			html += '</div>'//end pin;
			$('#pins').append(html);
			
			//hide elements as required
			if (!image.favorites[0]) $('#'+image.id+'-pin .display.favs').hide()//hide fav stat display
			if (!image.comments[0]) $('#'+image.id+'-pin .display.cmnts').hide()//hide cmmt stat display
			if (!image.comments[0]) $('#'+image.id+'-pin .pin-cmnts').hide()//hide cmmt section
			$('#'+image.id+'-pin form[name="pin-cmnt-form"]').hide()
			
			applyLayout();
		}//end typical view
		
		//lay out tags/group view
		if (av == 'tags'){
			console.log('-loadData-av == tags')
			//console.log('----setting up group: '+image.tags)
			
			//*TODO: seperate muti tags into individual tags
			//*TODO: Bug on groups scroll to bottom and url refresh (most likely related) check av flow.
			
			//build tags array for creation of tag/group covers
			for (key in image.tags){
				tag = image.tags[key]
				//add image.tags to tags array if it is not already there.  bump zero qty. to one
				if (!tags[tag]) {tags[tag]=1}else{tags[tag]=tags[tag]+1};
				//add group for each unique tag in tags array.
				if (tags[tag] == 1){
					tagId = idSafe(tag)
					console.warn(tagId)
					html += '<div class="pin group" id="'+tagId+'">'
						html += '<a class="thumbs"></a>'
						html += '<div class="info">'
							html += '<h5><a class="title">'+tag+'</a></h5>'
							html += '<div class="details"></div>'
						html += '</div>'
					html += '</div>'
				}
			}//end for
			
			$('#pins').append(html);
			
			//for each tag/group in images.tags, add image to tag/group untill max images reached
			for (key in image.tags){
				tag = image.tags[key]
				console.warn('image.tags: '+image.tags)
				console.warn('key: '+key)
				console.warn('image.tags[key]: '+image.tags[key])
				console.warn('tag: '+tag)
				console.warn('tags (below)')
				console.warn(tags)
				console.warn(tags[tag])
				//add images to group untill max images reached
				if (tags[tag] <= maxImages){
					tagId = idSafe(tag)
					console.warn('--adding image to tag id: '+tagId)
					$('#'+tagId+' .thumbs').append('<div class="'+tagId+' thumb"><img src="'+image.thumbnail+'" alt=""></div>');
					w = image.image.wdth
					h = image.image.height
					//todo finish resize images for icon square, also change image ref to thumb.
				}
			}//end for
			
			applyLayout();
		}//end tag/group view
	}//end image for loop

	// for each tag add place holder images as required by min/max
	if (av == 'tags'){
		for (key in tags){
			tagId = idSafe(key)
			console.log('--key: '+key)
			console.log('--tagId: '+tagId)
			//for tags with one image
			if (tags[key]==1) {
				$('#'+tagId+' .thumbs .thumb').addClass('p1');
			//TODO: add formatting for other image quantities here.
			//add extra blank images for pin layout if there are not enough existing then apply the layout
			}else if (tags[key] <= maxImages){
				//console.log('--<10 key: '+key)
				$('#'+tagId+' .thumbs .thumb').addClass('board');
				var i=tags[key]
				while (i < maxImages){
					//console.log('--while adding images key: '+key)
					$('#'+tagId+' .thumbs').append('<div class="thumb board space"><img width="64px" height="2px" src="http://www.webdesign.org/img_articles/12337/1_002.jpg" alt=""></div>');
					i++;
				}
				//apply layout to pins in tag group
				layoutThumbs('#'+tagId);
			}
			//fix up layout after extra images added
			applyLayout();
		}
	}
	
	//TOUCH DEVICE SETUP features
	if (!is_touch_device()){
		$('.touch-off').toggleClass('touch-off touch-on');
		$('.touch-on').toggleClass('hide show');
	}
	
	isLoading = false;
	$('#loader').hide();
};

//label tool-tips with ios support
$(document).on( 'click touchstart', 'label[title]', function(e){	
	alert(e.target.title)
});

//FORM SUBMIT FUNCTIONS
$(document).ready(new function() {
	//TODO TEST: chanded $(document) to $(window) for ios compat
    //TODO TRY: does this need to be in doc ready? 
	$(window).bind('scroll', onScroll);
	$(window).bind('touchstart', onScroll);
	$(window).bind('touchend', onScroll);
	$(window).bind('touchcancel', onScroll);
	
	var _super = $.ajaxSettings.xhr;
	$.ajaxSetup({
		// Required for reading Location header of ajax POST responses in firefox.
		xhr: function () {
			console.log('-------------xhr setup xhr--');
			var xhr = _super();
			var getAllResponseHeaders = xhr.getAllResponseHeaders;
			xhr.getAllResponseHeaders = function () {
				var allHeaders = getAllResponseHeaders.call(xhr);
				if (allHeaders) {
					return allHeaders;
				}
				allHeaders = "";
				$(["Cache-Control", "Content-Language", "Content-Type", "Expires", "Last-Modified", "Pragma", "Location"]).each(function (i, header_name) {
					if (xhr.getResponseHeader(header_name)) {
						allHeaders += header_name + ": " + xhr.getResponseHeader(header_name) + "\n";
					}
				});
				return allHeaders;
			};
			return xhr;
		},
		//TODO: temp added for X-CSRFToken header
		beforeSend: function(xhr, settings) {
			console.log('-------------before send--');
			function getCookie(name) {
				var cookieValue = null;
				if (document.cookie && document.cookie != '') {
					var cookies = document.cookie.split(';');
					for (var i = 0; i < cookies.length; i++) {
						var cookie = jQuery.trim(cookies[i]);
						// Does this cookie string begin with the name we want?
					if (cookie.substring(0, name.length + 1) == (name + '=')) {
						cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
						break;
					}
				}
			}
			return cookieValue;
			}
			if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
				// Only send the token to relative URLs i.e. locally.
				xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
			}
		} 
	}); 
	//capture form submit funtions
	$('#re-pin-form').submit(function () { //// catch the form's submit event
		//ALT: this uses api to submit repin, alternitively use the ajax submit on python/js
		data = $(this).serializeObject()
		delete data.id
		data.tags = [data.tags]//TODO: try {} for tags to solve comma parse issue
		//TODO: validate tags exist here
		sData = JSON.stringify(data)
		ajax(pinURL, true, 'POST', undefined, undefined, sData);
		$('#re-pin').modal('toggle')
		return false
	});
	//load initial pin data
    loadData();
});

/**On clicking an image show fancybox original.
 * 
 */
$('.fancybox').fancybox({
    openEffect: 'none',
    closeEffect: 'none'
});


/**Pin Functions.
 * 
 */
//pin options button for touch devices
$(document).on('click', '.pin-options-btn', function(e){
	target = $(e.target).closest('.pin');
	id = target[0].id;
	console.warn(id);
	target = $('#'+id+' .pin-options');
	console.warn(aOptions)
	console.warn(target)
	if(!aOptions){
		console.warn('1')
		target.toggleClass('touch-hover');
		aOptions = target;
	}else if(aOptions && aOptions[0] == target[0]){
		console.warn('2')
		aOptions.toggleClass('touch-hover')
		aOptions = undefined;
	}else if(aOptions != undefined && aOptions[0] != target[0]){
		console.warn('3')
		aOptions.toggleClass('touch-hover')
		target.toggleClass('touch-hover');
		aOptions = target;
	}
}); 

//Options: Favorite
$('#favs').live('click', function(e){
	e.preventDefault();
	togglePinStat(this, 'icon-star', 'icon-star-empty', '/toggle/pins/Pin/');
});
//Options: Repin
$('#repins').live('click', function(e){
	e.preventDefault();
	var button = $(this);
	var name = button.attr('id');
	var state = button.attr('data-state');
	var pin = $($(this).closest(".pin"));
	var id = parseInt(pin.attr('id'));
	var data = pinA[id]
	$("#re-pin #id_srcUrl").attr("value", data.srcUrl);
	$("#re-pin #id_imgUrl").attr("value", data.imgUrl);
	$("#re-pin #id_repin").attr("value", data.repin);
	$("#re-pin #thumb_id").attr("src", data.imgUrl);
	//ts = "-moz-box-shadow: 0 2px 12px rgba(0,0,0,.75); -webkit-box-shadow: 0 2px 12px rgba(0,0,0,.75); box-shadow: 0 2px 12px rgba(0,0,0,.75); display: inline-block;";
	//setStyles(t, ts);
	$('#re-pin.modal').modal('toggle')
	console.warn(data)
});

//Options: Comment: open form
$('#cmnts').live('click', function(e){
	e.preventDefault();
	var pin = $($(this).closest(".pin"));
	var id = parseInt(pin.attr('id'));
	pin.find('.pin-cmnts').append(insertCommentForm(id))
	pin.find('.pin-cmnts').show()
	applyLayout()
	//scroll to comment form
	ws = getWindowSize()
	center = (ws.height/2)
	$('html,body').animate({scrollTop: pin.find('form[name="pin-cmnt-form"]').offset().top-center}, 500);
});

//Comment: submit form
$(document).on( 'submit', '.pin form', function(e){
	e.preventDefault();
	data = $(this).serializeObject()
	console.warn(data)
	//TODO: validate comment exist here with max length
	sData = JSON.stringify(data)
	var target = $(this).closest(".pin").find("#cmnts");//TODO: aply this tecnique throughout!!!!
	togglePinStat(target[0], 'icon-chat', 'icon-chat-empty', cmntURL, null, sData)
});
//Comment: cancel form
$(document).on( 'click', '.pin form .cancel.btn', function(e){
	e.preventDefault();
	console.log('click cancel');
	pcf = $($(this).closest('form[name="pin-cmnt-form"]'));
	cmnts = pcf.closest('.pin-cmnts');
	cmnt = pcf.closest('.pin-cmnt');
	console.log(cmnt[0])
	if (cmnt[0]){cmnt.children().show()}else{cmnts.hide()}
	pcf.remove();
	applyLayout();
	
	//pcfp = pcf.parent('.pin-cmnt')
	//cmntp.replaceWith(insertComment(result.user.username , result.user.id ,result.comment))//relace edited comment div with new comment


});
//Comment: post success callback
function cmntsSuccess(result, pin){
	console.warn('result of post')
	console.warn(result)
	cmnt = (pin.find('.pin-cmnt[data-cmnt='+result.id+']'))
	if(cmnt.length > 0){
		console.warn('-id exists')
		cmnt.replaceWith(insertComment(result.user.username , result.user.id ,result.comment))//relace edited comment div with new comment
	}else{
		pin.find('.pin-cmnts').append(insertComment(result.user.username , result.user.id ,result.comment))//append new comment to end of comments
	}
	pin.find('form[name="pin-cmnt-form"]').remove()//remove form
	applyLayout()
}
//Comment: edit
$(document).on('click', '.pin-cmnt [class^="icon-"]', function(e){
	var pin = $($(this).closest(".pin"));
	var pinId = parseInt(pin.attr('id'));
	cmnt = $(this).closest(".pin-cmnt")
	cmntId = parseInt(cmnt.attr('data-cmnt'))//get comment id
	cmntT = cmnt.find('.display.text').html()//get comment text
	cmnt.children().hide()//hide existing comment
	cmnt.append(insertCommentForm(pinId, cmntT, cmntId))//add comment form
	applyLayout()
	pin.css('z-index', 1000);
});

//Comment: insert comment
function insertComment(username, userid, cmntT, cmntId){
	var html = ""
	if (!cmntId){cmntId=""};
	html += '<p class="pin-cmnt" data-cmnt='+cmntId+'>';
	html += '<i class="icon cmnts"></i>';
	html += '<a href="user/'+username+'">' +username+': </a>';
	html += '<span class="display text light" >'+cmntT+'</span>';
	if (userid == authUserO.id){html += '<i class="icon-edit"></i>'}
	html += '</p> ';
	return html
}
//Comment: insert comment form
function insertCommentForm(pinId, cmntT, cmntId){
	var html = ""
	html += '<form action="" enctype="multipart/form-data" method="post" name="pin-cmnt-form" class="pin-cmnt-form form">';
		html += '<div id="div_comment" class="">'
			html += '<label id="comment_label" class="control-label" for="comment"></label>'
			html += '<span class="help-inline control-label"></span>'
			html += '<div class="controls">'
				console.log(cmntId)
				if (cmntId){html += '<input type="hidden" name="id" id="id_id" value='+cmntId+'>'}
				html += '<textarea id="id_comment" placeholder="Enter your comment here." name="comment">'
				if(cmntT){html += cmntT}
				html +='</textarea>'
				html += '<input type="hidden" name="object_pk" value='+pinId+' id="id_content_type">'
				html += '<input type="hidden" name="content_type_id" value=10 id="id_object_pk">'
			html += '</div>'
			html += '<button href="" class="cancel btn btn-mini">Cancel</button>'
			html += '<button type="submit" class="btn btn-mini btn-primary">Post</button>'
		html += '</div>'
	html += '</form>';
	return html;
}

//TODO: integrate ajax funtion
//TODO: add follow function into this

/*Toggles Pin Status for options bar icos and for pin sats area, icons & counts: 
- xxx: is a unique name of the stat to toggle
- targetBtn: the HTML element acting as the toggle button
  must have: id="xxx" set staticly by onLoadData
  must have: data-state="true/false" current state of the toggle set dynamicly by onLoadData 
- .pin #id-Pin: must have: data-xxx="qty of stat"
  must have: class="display text xxx" to dispay the current count
  must have: class="display icon-iconname xxx" to display's the icon (must be 11px X 11p)
- pin.profile: must have:data-xxx="qty of stat" 
  must have: class="display text xxx" to dispay the current count
- Callback: if functtion xxxSuccess(result) is defined it will be triggerd result = returned data
*/

function togglePinStat(targetBtn, tIcon, fIcon, url, id, data){
	var button = $(targetBtn);
	var name = button.attr('id');
	var state = button.attr('data-state');
	var pin = $($(targetBtn).closest(".pin"));
	if (url === undefined){
		url = ""
		id = ""
	}else if (id === undefined){
		id = parseInt(pin.attr('id'));
		url = url+id+'/';
	}else if (id === null){
		url = url
	}else if (id){
		url = url+id+'/'
	}
	var count = pin.attr('data-'+name);
	var disp = pin.find('.display.'+name);
	var dispText = pin.find('.display.text.'+name);
	var countP = aProfile.attr('data-'+name);
	var dispTextP = aProfile.find('.display.text.'+name);
	
	if (authUserO && authUserO.username == aProfileO.username) {
		var updateProfile = true;
	}

	this.onSuccess = function(result) {
		if (state == "true"){
			count--;
			countP--;
			button.attr('data-state', "false");
			button.addClass(fIcon);
			button.removeClass(tIcon);
			pin.attr('data-'+name, count);
			dispText.html(count);
			if (count == 0) {
				disp.hide();
			}
			if (updateProfile){
				aProfile.attr('data-'+name, countP);
				dispTextP.html(countP);
			}
		}else{
			count++;
			countP++;
			button.attr('data-state', "true");
			button.addClass(tIcon);
			button.removeClass(fIcon);
			pin.attr('data-'+name, count);
			dispText.html(count);
			disp.show();
			if (updateProfile){
				aProfile.attr('data-'+name, countP);
				dispTextP.html(countP);
			}
		}
		if (result && typeof(window[name+'Success']) === "function"){
			window[name+'Success'](result, pin);
		}
	}
	
	if (typeof url == "string" && url != ""){
		console.warn('-ajax - 3 togglepin()');
		$.ajax({//3
			url: pinsPrefix+url,
			type: 'POST',
			data: data,
			contentType: 'application/json',
			success: $.proxy(this.onSuccess, this),//TODO: swap fav image
			error: function(jqXHR, settings) {
				console.warn('addfav - ajax error');
			},
		});
	}
}

/**
 * Profile Functions.
 */

// add event listeners for profile buttons
$('#user-pins').live('click', function(event){
	loadData(null, aProfileO.username);
});
$('#user-tags').live('click', function(event){
	loadData(vn.tags, aProfileO.username);
});
$('#user-favs').live('click', function(event){
	loadData(vn.favs, aProfileO.username);
});
$('#follow').live('click', function(event){
	follow(this, 'followers');
});

//welcome profile
$('#Recent-all').live('click', function(event){
	loadData(null, 'all');
	return false
});
$('#Popular-all').live('click', function(event){
	loadData(vn.pop, 'all');
	return false
});
$('#Category-all').live('click', function(event){
	loadData(vn.tags, 'all');
	return false
});

//toggle follow / unfollow
function follow(targetBtn, display) {
	var button = $(targetBtn);
	if (display){var name = display}else{
		var name = button.attr('id')
	}
	var state = button.attr('data-state');
	var pin = $($(targetBtn).closest(".pin"));
	var id = parseInt(pin.attr('id'));
	var count = pin.attr('data-'+name);
	var disp = pin.find('.display.'+name)
	var dispText = pin.find('.display.text.'+name)

	this.onFollow = function( result ) {
		console.log('onFollow', result);
		// Update the number of followers displayed.
		console.log('count: '+count)
		console.log('state = '+state)
		if(state == "true") {
			button.attr('data-state', 'false');
			button.html('Follow')
			count--;
			console.log('count: '+count)
			//this.showLoader('Liking');
		} else {
			button.attr('data-state', 'true');
			button.html('Un-Follow')
			count++;
			console.log('count: '+count)
			//this.showLoader('Unliking');
		}
		pin.attr('data-'+name, count);
		dispText.html(count);
	};
	
	var url = pinsPrefix+'/toggle/auth/User/'+id+'/';
	console.warn('-ajax - 4 follow()');
	$.ajax({//4
		url: url,
		type: 'POST',
		contentType: 'application/json',
		/* headers:  {
			'x-requested-with' : 'XMLHttpRequest' //// add header for django form.is_valid() 
		},
		beforeSend: function(jqXHR, settings) {
			jqXHR.setRequestHeader('X-CSRFToken', $('input[name=csrfmiddlewaretoken]').val());
		}, */
		success: $.proxy(this.onFollow, this),//todo: need to detect if followed or not
		error: function(jqXHR, settings) {
			console.warn('follow - ajax error');
		},
	});
}

/**
 * tag/group view click handlers
 */
//add click handler for pin functions
//tag/groups
$(document).on( 'click', '.pin.group .thumbs', function(event){
	console.warn('group clicked')
	target = $(event.target).closest('.pin.group')
	id = target[0].id
	loadData(id, aProfileO.username);
});

/**
 * Edit pin functions.
 */
$(document).ready(function() {
	//global vars
	prevUpload = false;
	thumbTarget = 'img#thumb_id'
	cUrl = $(thumbTarget).attr("src")
	console.log('document ready,  thumbTarget: '+thumbTarget+' / cUrl: '+cUrl)
	fileUploaders = replaceFileUpload('div#div_id_image');//*set fileFiled to disapy none on html then set to block after load
	console.log('fileUploaders = ')
	console.log(fileUploaders)
	//addClearToFileUploadBtn('.qq-upload-button');
	onFileChange();
	onUrlChange();
});
//detect image file changes
function onFileChange(thumb) {
	$('imput#id_uImage').change(function() {
		console.log('image changed - updating thumb');
		updateThumb(thumbTarget, this, 'input#id_imgUrl');
	});
}
//detect image url changes
function onUrlChange() {
	$('input#id_imgUrl').change(function() {
		console.log('url change detected');
		updateThumb(thumbTarget, this);
	});
}
//Replaced the specified target with the file-uploader element, Requires file-uplader.js
//- an element targeted by id(#) must be prefixed by an element
function replaceFileUpload(target){
	var i = 0
	var fileUploaders = []
	$(target).each(function() {
		var fileUploader = new qq.FileUploader( {
			action: "/ajax/thumb/",
			element: $(target)[i],
			multiple: false,
			allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],               
			sizeLimit: 0,   
			minSizeLimit: 0,
			template: '<div class="qq-uploader">' + 
                '<div class="qq-upload-drop-area"><span>Drop files here to upload</span></div>' +
                '<div class="qq-upload-button">Click to Browse or Drag Image Here</div>' +
                '<ul class="qq-upload-list"></ul>' + 
             '</div>',
			onError: function(id, fileName){
				//get error image
				$(thumbTarget).attr("src", '');
			},
			onSubmit: function(id, fileName){
				//remove previous item from list
				$('.qq-upload-list').children().remove()
				//get loading image
				$(thumbTarget).attr("src", '/static/core/img/thumb-loader.gif');
			},
			onComplete: function( id, fileName, responseJSON ) {
				if( responseJSON.success ) {
					console.log('image uplaod success!');
					onFileChange();
					//store and delete previoius thumb
					prevUpload = $('input#id_uImage').val();
					console.log('prevUpload = '+prevUpload);
					if (prevUpload){
						uImageDelete(prevUpload);
					}
					//update uImage with tmpName for form and model
					$('input#id_uImage').attr("value", responseJSON.tmpName);
					//update variable with current uploaded file name for deletion
					uFileName = responseJSON.tmpName
					//update thumb
					updateThumb(thumbTarget, responseJSON, '#id_imgUrl');

				}else{
					console.warn('image uplaod failed :(')
				}
			},
			onAllComplete: function( uploads ) {
				// uploads is an array of maps
				// the maps look like this: { file: FileObject, response: JSONServerResponse }
				console.log('All uploads complete!: '+uploads)
				//re attach onFileChange due to html reset in file uplaoder
			},
			params: {
			  'csrf_token': $('input[name=csrfmiddlewaretoken]').val(),
			  'csrf_name': 'csrfmiddlewaretoken',
			  'csrf_xname': 'X-CSRFToken',
			},
		} ) ;
		//modify file uploader properties
		fileUploader._formatFileName = function(name){
			if (name.length > 15){
				name = name.slice(0, 15) + '...' + name.slice(-4);    
			}
			return name;
		}
		fileUploaders[i] = fileUploader;
		i++;
	});
	return fileUploaders
}

//(not used) wraps fileUpload field with clear button
var wrapTarget = false;
function addDeleteBtnToFileUpload(target){
	var file_input_index = 0;
    $(target).each(function() {
        file_input_index++;
		wrapId = $(this).attr('id')+'_wrap_'+file_input_index
		wrapTarget = "#"+wrapId
        $(this).wrap('<div id='+wrapId+'</div>');
        $(this).before('<input style="vertical-align: top; margin-right:2px; padding:1px 3px;" class="btn" type="button" value="X" onclick="reset_html(\'#'+wrapId+'\')" />');
		console.log('clear button added')
	});
}

//inputObj must be an HTML Object: use $()[0] to get HTML object form $() 
function updateThumb(thumbTarget, inputObj, clear) {
	console.log('-start updateThumb with object: '+inputObj);
	
	//remove thumb size
	$(thumbTarget).removeAttr('width');
	$(thumbTarget).removeAttr('height');
	
	if (inputObj.success){ 
		//update thumb for uImage change
		thumbUrl = inputObj.tmpUrl;
		$(thumbTarget).attr("src", thumbUrl)
		console.log('updated thumb with new uImage: '+thumbUrl)
	}else{
		//update thumb for url change 
		thumbUrl = inputObj.value;
		$(thumbTarget).attr("src", thumbUrl);
		console.log('updated thumb with new url: '+thumbUrl)
	}
	if (clear){
		console.log('start clear')
		//clear imgUrl or uImage when other is updated
		oldVal = $(clear).attr("value");
		$(clear).attr("value", null);
		newVal = $(clear).attr("value");
		console.log('end clear result: '+clear+' oldVal: '+oldVal+' newVal: '+newVal)
		console.log('-end updateThumb')
	}
	
}
//clear image upload field
function reset_html(clear) {
	console.log('reset html for: '+clear)
    $(clear).html($(clear).html());
	onFileChange()
	console.log('id_imgUrl.value: '+$('#id_imgUrl').attr("value"))
	if ($('#id_imgUrl').attr("value") == "") {
		$('#thumb_id').attr("src", cUrl);
		$('#id_imgUrl').attr("value", cUrl);
	}
}
//Delete uploaded image
function uImageDelete(fileName) {
	var jqxhr = $.post('/ajax/thumb/'+fileName, function() {
      console.log('ajax del success: '+fileName);
    })
    .success(function() { console.log('ajax del success2'); })
    .error(function() { console.warn('ajax del error'); })
    .complete(function() { console.log('ajax del complete'); });
}
//Cancel new pin
function cancelNewPin(){			
	if (prevUpload){
		uImageDelete(prevUpload);
	}
	prevUpload = false;
	//remove previous item from list
	$('.qq-upload-list').children().remove()
	//get default image
	$(thumbTarget).attr("src", '/static/core/img/thumb-default.png');
}


/** 
 * UTILITIES
 */
//checks if value is in an array return false or value
function inArray(value, array){
	var i;
	for (i=0; i < array.length; i++) {
		if (array[i] === value) {
			return value;
		}
	}
	return false;
};
//check for if key exists for given value in array, return false or key
function getKey(value, array){
	for (key in array) {
		if (array[key] === value) {
			return key;
		}
	}
	return false;
};
//check for if value exists for given key in array, return false or value
function getValue(key, array){
	for (i in array) {
		if (array[key]) {
			return array[key];
		}
	}
	return false;
};
//get host name from url
function getHost(url){
	var a = document.createElement('a');
	a.href = url;
	p = a.hostname.split("www.")
	if (p[1]===undefined){h=p[0]}else{h=p[1]};
	return h
}
function getWindowSize() {
  var myWidth = 0, myHeight = 0;
  if( typeof( window.innerWidth ) == 'number' ) {
    //Non-IE
    myWidth = window.innerWidth;
    myHeight = window.innerHeight;
  } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    //IE 6+ in 'standards compliant mode'
    myWidth = document.documentElement.clientWidth;
    myHeight = document.documentElement.clientHeight;
  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
    //IE 4 compatible
    myWidth = document.body.clientWidth;
    myHeight = document.body.clientHeight;
  }
  return {width:myWidth, height:myHeight}
}
function idSafe(s){
	s = s.replace(/\s/g, '-')
	s = s.replace(/&/g, 'ands')
	return s
}
function displaySafe(s){
	s = s.replace(/%20/g, ' ')
	s = s.replace(/%26/g, '&')
	return s
}
function urlSafe(s){
	s = s.replace(/&/g, '%26')
	return s
}

//jquery function to format form data as assoc.array
(function($){
    $.fn.serializeObject = function(){
        var self = this,
            json = {},
            push_counters = {},
            patterns = {
                "validate": /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
                "key":      /[a-zA-Z0-9_]+|(?=\[\])/g,
                "push":     /^$/,
                "fixed":    /^\d+$/,
                "named":    /^[a-zA-Z0-9_]+$/
            };
        this.build = function(base, key, value){
            base[key] = value;
            return base;
        };

        this.push_counter = function(key){
            if(push_counters[key] === undefined){
                push_counters[key] = 0;
            }
            return push_counters[key]++;
        };

        $.each($(this).serializeArray(), function(){

            // skip invalid keys
            if(!patterns.validate.test(this.name)){
                return;
            }

            var k,
                keys = this.name.match(patterns.key),
                merge = this.value,
                reverse_key = this.name;

            while((k = keys.pop()) !== undefined){

                // adjust reverse_key
                reverse_key = reverse_key.replace(new RegExp("\\[" + k + "\\]$"), '');

                // push
                if(k.match(patterns.push)){
                    merge = self.build([], self.push_counter(reverse_key), merge);
                }

                // fixed
                else if(k.match(patterns.fixed)){
                    merge = self.build([], k, merge);
                }

                // named
                else if(k.match(patterns.named)){
                    merge = self.build({}, k, merge);
                }
            }

            json = $.extend(true, json, merge);
        });

        return json;
    };
})(jQuery);