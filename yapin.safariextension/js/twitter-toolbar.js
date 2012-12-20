GLOBAL = safari.extension.globalPage.contentWindow
USER_OFFSET = 350
setInterval(render_trends, 120000)
setTimeout(render_trends, 3000)
controller = {}
$(function(){
	if (navigator.userAgent.match(/Windows/)){
		$(document.body).addClass('windows')
		$('#twitter_search_field').attr('size', 24)
	}
})
function send_active_tab(message, payload){
  safari.application.activeBrowserWindow.activeTab.page.dispatchMessage(message, payload)
}
function isBlankPage(){
  return safari.application.activeBrowserWindow.activeTab.url == ''
}
URL_REGEX = /((http(s)?:\/\/?)[^\s()<>]+(?:\([\w\d]+\)|([^[:punct:]\s]|\/))*)/g
function render_tweet(text){
  if (text.match(/http(s)?\:\/\/[^\s]*"+[^\s]*/)){
    return text
  } else {
    return text.replace(URL_REGEX, '<a href="$1" rel="$1" class="url">$1</a>')
      .replace(/(^|\s)@([a-zA-Z0-9_]+)/g, '$1@<a class="screen_name" href="$2" rel="$2">$2</a>').replace(/\n/g, "<br />")
  }
}
function start_search(options){
  if (options.search_box){
    query = $('#twitter_search_field').val()
    title =  "&ldquo;" + unescape(query) + "&rdquo;"
  } else if (options['type'] == 'related') {
    var url = safari.self.browserWindow.activeTab.url
    var pageTitle = safari.self.browserWindow.activeTab.title
    query = url
    if (url.match(/^http:\/\/(www\.)?youtube.com/)){
      query += ' OR ' + url.split('&')[0]
    } else {
      if (url.split('?').length > 0) {
        query += ' OR ' + url.split('?')[0]
      }
    }
    if (!pageTitle.match(/"/)) {
      query += ' OR "' + pageTitle + '"'
    }
    query += ' -RT'
    title = "Related Tweets"
  } else if (options['type'] == 'trend') {
    query = options.query
    title = options.title
  }
  if (!query)
    return
  if (isBlankPage()){
    if (options['type'] == 'related'){
      return false
    }
    safari.application.activeBrowserWindow.activeTab.url = 'http://twitter.com/search?q=' + escape(query)
    return false
  }
  send_active_tab('sidebar', {'show_loader': true, 'type': options['type']})
  $.ajax({ 
      url: "http://search.twitter.com/search.json", 
      type: 'GET',
      dataType: 'json',
      data: {'q': query, 'result_type': 'mixed', 'asource': GLOBAL.source},
      success: function(data, textStatus, xhr){
        var u = ''
        $.each(data.results, function(i, result){
          var is_popular = false
          var retweet_count = 0
          if (result.metadata && result.metadata.result_type == 'popular') {
            is_popular = true
            retweet_count = result.metadata.recent_retweets
          }
          u += GLOBAL.Mustache.to_html(GLOBAL.SEARCH_RESULT_PARTIAL,
            {profile_image_url: result.profile_image_url,
            screen_name: result.from_user,
            id: result.id,
            time_ago: $.timeago(result.created_at),
            text: render_tweet(result.text),
            popular: is_popular,
            retweets: retweet_count
            })
          if (i < data.results.length)
            u += "<hr />"
        })
        send_active_tab('sidebar', {'html': u, 'title': title})
      },
      error: function(data, textStatus, xhr){
       alert("Error Performing Search") 
      }
    })
}
function show_user(screen_name){
  controller.show_users_request(screen_name)
}

controller.signin_complete = function(){
  if (SIGNIN_CALLBACK){
    safari.application.activeBrowserWindow.activeTab.close()
    SIGNIN_CALLBACK()
    SIGNIN_CALLBACK = null
  }
}
controller.show_users_in_toolbar = function(message){
  var u = message.unique()
  u = $.grep(u, function(v, i){
    if (i > 5)
      return false
    if ($.inArray(v, GLOBAL.BANNED_SCREEN_NAMES) != -1)
      return false
    return true
  })
  TOOLBAR.current_users = u
  if (TOOLBAR.current_users.length > 0){
    var u = ''
    $.each(TOOLBAR.current_users, function(i, screen_name){
      u += "<a href='http://twitter.com/" + screen_name + "' onclick='show_user(\"" + screen_name + "\"); return false' rel='" + screen_name + "' class='user button'>@" + screen_name + "</a>"
    })
    $('#user_list_target').html(u)
    $('#users_list').css('opacity', '1')
    $('#trends').css('left', USER_OFFSET + $('#users_list').get(0).clientWidth + 'px')
  } else {
    $('#user_list_target').html('')
    $('#users_list').css('opacity', '0')
    $('#trends').css('left', USER_OFFSET + 17 + 'px')
  }
}

function paramaterize(data){
  var params = {}
  $.each(data.split('&'), function(i,kv){
    var split = kv.split('=')
    params[split[0]] = split[1]
  })
  return params
}

controller.oauth_callback = function(url){
  var params = paramaterize(url.split('?')[1])
  var t = paramaterize(safari.extension.settings.lastRequestToken).oauth_token
  client.create_oauth_access({
    'params':{oauth_verifier: params.oauth_verifier},
    accessor: {token: t},
    success:function(data){
      var result = paramaterize(data)
      safari.extension.settings.lastRequestToken = null
      safari.extension.settings.accessToken = result.oauth_token
      safari.extension.settings.accessTokenSecret = result.oauth_token_secret
      safari.extension.settings.currentUser = result.screen_name
      controller.signin_complete()
    }, error:function(data){
    }
  })
}
function signOut(){
  safari.extension.settings.accessToken = null
  safari.extension.settings.accessTokenSecret = null
  safari.extension.settings.currentUser = null
}
function reveal_signin(){
  client.create_oauth_request({params:{'oauth_callback': safari.extension.baseURI + 'callback.html'},success:function(data){
    safari.extension.settings.lastRequestToken = data
    safari.application.activeBrowserWindow.openTab('foreground').url = "http://api.twitter.com/oauth/authorize?oauth_token=" + paramaterize(data).oauth_token
  }, error: function(data){}})
}

function slide_out_browser(){
  $('#browser').addClass('transitioning')
  $(document.body).addClass('slid_out')
}
function slide_back(){
  $(document.body).removeClass('slid_out')
  setTimeout(function(){
    $('#browser').removeClass('transitioning')
    $('#composer').removeClass('visible')
    $('#follow').removeClass('visible')
    $('#signin').removeClass('visible')
  }, 600)
}
SIGNIN_CALLBACK = null
function isLoggedIn(){
  return false
  if (safari.extension.settings.currentUser){
    return safari.extension.settings.currentUser
  } else {
    return false
  }
}
controller.compose_tweet_request = function(options){
  var status = ''
  var quote = safari.application.activeBrowserWindow.activeTab.title.replace(/[^a-zA-Z0-9\s:\,\.!]/g, ' ')
  status += '"' + quote + '" '
  $.get("http://bit.ly:82/api/shorten/?apiKey=R_9228e882a4b87b716eb24b66f75a7226&version=3.0&uri=" + escape(options.url), function(response){
    status += response.replace(/\n/g, '')
    controller.open_tab("http://twitter.com/home?source=safari_extension&status=" + escape(status))
  })
  return false
}

function render_users(users, screen_name){
  u = ''
  $.each(users, function(i, user){
    u += GLOBAL.Mustache.to_html(GLOBAL.USER_PARTIAL, {
      profile_image_url: user.profile_image_url,
      screen_name: user.screen_name,
      user_id: user.id,
      name: user.name,
      description: user.description,
      show_unfollow_button: (user.following == null ? false : user.following),
      show_follow_button: (user.following == null ? true : !user.following),
      highlight: (user.screen_name == screen_name ? ' highlight' : '')
      })
  })
  return u
}

controller.switch_users = function(message){
  send_active_tab('close_composer', {})
  var current_tab = safari.application.activeBrowserWindow.activeTab
  SIGNIN_CALLBACK = function(){
    current_tab.activate()
    controller.compose_tweet_request({})
  }
  signOut()
  reveal_signin()
}

controller.set_toggled_buttons = function(message){
  // $('#conversations_about_this').removeClass('toggled')
  // if (message['related']){
  //   $('#conversations_about_this').addClass('toggled')
  // }
}

function logged_in_user_request(screen_name){
  var selectors = []
  var u = []
  var f = []
  $.each(TOOLBAR.current_users, function(i, screen_name){
    selectors.push(['find_user', {'params': {'screen_name': TOOLBAR.current_users[i]},
      success: function(data){u[i] = data}}])
    selectors.push(['find_friendship', {'params':{'target_screen_name': screen_name},
      success: function(data, textStatus, xhr){ f[i] = data }}])
  })
  client.batch(selectors, {success:function(){
    var merged = []
    $.each(u, function(i, user){
      merged[i] = user
      merged[i].following = f[i].relationship.source.following
    })
    send_users_to_sidebar(u, screen_name)
  }})
}
function send_users_to_sidebar(u, screen_name){
  safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("sidebar",
    {html: render_users(u, screen_name), title: 'Users on this page'})
}
function logged_out_user_request(screen_name){
  var user_selectors = []
  var u = []
  $.each(TOOLBAR.current_users, function(i, screen_name){
    user_selectors.push(['find_user', {'params':{'screen_name': screen_name},
      success: function(data, textStatus, xhr){
        u[i] = data
        u[i].following = null
      }}])
  })
  client.batch(user_selectors, {success:function(){
    send_users_to_sidebar(u, screen_name)
  }})
}
controller.show_users_request = function(screen_name){
  send_active_tab('sidebar', {'show_loader': true, 'type': 'users'})
  if (isLoggedIn()){
    logged_in_user_request(screen_name)
  } else {
    logged_out_user_request()
  }
}

$(function(){
  $('#open_composer').click(function(){
    if (safari.extension.settings.composer == 'tweetie'){
      send_active_tab('open_tweetie')
    } else {
      send_active_tab('send_selection_for_tweet', {})
    }
    return false
  })
  $('#conversations_about_this').click(function(){
    if ($(this).hasClass('toggled')){
      $(this).removeClass('toggled')
      send_active_tab('close_search_results', {})
    } else {
      // $(this).addClass('toggled')
      var url = safari.self.browserWindow.activeTab.url
      start_search({'type': 'related'})
    }
    return false
  })
  $('.slide_back').click(function(){
    slide_back()
    return false
  })
  $('#sign_in_button').click(function(){
    slide_back()
    safari.application.openBrowserWindow().activeTab.url = 'http://twitter.com/sessions/new'
    return false
  })
  render_trends()
})

TOOLBAR = {}
TOOLBAR.current_users = null

COMPOSER = {}
COMPOSER.user = null
COMPOSER.url = null
COMPOSER.token = null

controller.post_tweet = function(status){
  client.create_tweet({params:{'status': status},
    success:function(){
      send_active_tab('close_composer', {})
    }})
}

controller.follow = function(options){
  if(isLoggedIn()){
    client.create_follow(options.user_id, {params:{}, success:function(){
      send_active_tab('change_to_following', {user_id: options.user_id})
    }})    
  } else {
    var current_tab = safari.application.activeBrowserWindow.activeTab
    SIGNIN_CALLBACK = function(){
      current_tab.activate()
      var c = function(){
        controller.show_users_request()
      }
      client.create_follow(options.user_id, {params:{}, success:c, error:c})
    }
    reveal_signin()
  }
}

controller.unfollow = function(options){
  client.destroy_follow(options.user_id, {params:{}, success:function(){
    send_active_tab('change_to_not_following', {user_id: options.user_id})
  }})
}
controller.proxy_back = function(messageEvent) {
  safari.application.activeBrowserWindow.activeTab.page.dispatchMessage(messageEvent.message[0], messageEvent.message[1])
}
controller.open_tab = function(url) {
  safari.application.activeBrowserWindow.openTab('foreground').url = url
}

controller.loaded = function(url) {
  if (url == safari.application.activeBrowserWindow.activeTab.url){
    send_active_tab('send_toolbar_info', {})
  }
}

LAST_RELEVANT_DATA = ''
controller.highlight_relevant_data = function(message){
  var data = (message && message.data) || LAST_RELEVANT_DATA
  LAST_RELEVANT_DATA = data
  $('.trend').removeClass('relevant')
  if (safari.self.browserWindow.activeTab.url && safari.self.browserWindow.activeTab.url.match(/http(s)?:\/\/.*twitter\.com/))
    return
  $('.trend').each(function(i, trend) {
    if (LAST_RELEVANT_DATA.match(new RegExp(trend.innerHTML, 'i'))){
      $(trend).addClass('relevant')
    }
  })
}

controller.proxy_back = function(message) {
  safari.application.activeBrowserWindow.activeTab.page.dispatchMessage(message[0], message[1])
}

function dispatcher(message){
  if (controller[message.name]) {
    controller[message.name](message.message)
  } else {

  }
}

safari.self.browserWindow.addEventListener("message", dispatcher, false)

safari.self.browserWindow.addEventListener("command", function(event){
  if (event.command == 'quote_in_tweet'){
    send_active_tab('send_selection_for_tweet', {})
  }
}, false)

$('.trend').live('click', function(){
  start_search({'type': 'trend', query: unescape(this.rel), title: this.innerHTML})
  return false
})

// Prevent accidentally dragging a link onto a page
$('a').live('dragstart', function(){
  return false
})
function render_trends(){
  if (GLOBAL.KILLSWITCH){
    document.body.innerHTML = GLOBAL.KILLSWITCH.message
  } else if (GLOBAL.CURRENT_TRENDS){
    $('#trend_loading').remove()
    $('#trend_target').html('')
    $.each(GLOBAL.CURRENT_TRENDS, function(i, trend){
      $('#trend_target').append('<a class="trend button" href="http://twitter.com/#search?q=' + escape(trend.query) + '" rel="' + escape(trend.query) + '">' + trend.name + "</a> ")
    })
    controller.highlight_relevant_data(false)
  }
}