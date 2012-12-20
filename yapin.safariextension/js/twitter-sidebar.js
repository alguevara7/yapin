TOOLBAR = safari.self.tab
controller = {}
controller.load = function(options){
  if (options['show_loader']){
    $(document.body).addClass('loading')
  } else {
    $(document.body).removeClass('loading')
    document.getElementById('toolbar_title').innerHTML = options.title
    document.getElementById('content').innerHTML = options.html
    document.getElementById('token').innerHTML = options.token
  }
}
controller.change_to_following = function(options){
  $('#user_' + options.user_id).removeClass('not_following').addClass('following')
}

controller.change_to_not_following = function(options){
  $('#user_' + options.user_id).removeClass('following').addClass('not_following')
}

$(function(){

  document.getElementById('TWclose_search_pane').onclick = function(){
    TOOLBAR.dispatchMessage('proxy_back', ['close_search_results', {}])
  }

  $('a.avatar, a.screen_name').live('click', function(){
    TOOLBAR.dispatchMessage('open_tab', 'http://twitter.com/' + $(this).attr('rel'))
    return false
  })

  $('a.url').live('click', function(){
    TOOLBAR.dispatchMessage('open_tab', $(this).attr('rel'))
    return false
  })

  $('a.time_ago').live('click', function(){
    TOOLBAR.dispatchMessage('open_tab', $(this).attr('rel'))
    return false
  })

  $('.follow_button').live('click', function(){
    TOOLBAR.dispatchMessage('follow', {token: $('#token').html(), user_id: $(this).attr('rel')})
    return false
  })

  $('.unfollow_button').live('click', function(){
    TOOLBAR.dispatchMessage('unfollow', {token: $('#token').html(), user_id: $(this).attr('rel')})
    return false
  })
})

safari.self.addEventListener("message", function(message){
  if (controller[message.name]) {
    controller[message.name](message.message)
  } else {

  }
}, false)
window.addEventListener('focus', function(){
  TOOLBAR.dispatchMessage('proxy_back', ['send_toolbar_info', {}])
})