from django.conf.urls import url

from . import views

urlpatterns = [
	url(r'^signup/$', views.sign_up, name='sign_up'),
	url(r'^getInit/$', views.getInit, name='getInit'),
    url(r'^(?P<uid>\d+)/getUserStories/(?P<sid>\d+)/(?P<n>\d+)/$', views.getUserStories, name='getUserStories'),
    url(r'^(?P<uid>\d+)/getReadLater/(?P<rlid>\d+)/(?P<n>\d+)/$', views.getReadLater, name='getReadLater'),
    url(r'^getReadLaterStory/(?P<sid>\d+)/', views.getReadLaterStory, name='getReadLaterStory'),
	url(r'^getStory/(?P<sid>\d+)/$', views.getStory, name='getStory'),
	url(r'^getBranch/(?P<bid>\d+)/$', views.getBranch, name='getBranch'),
	url(r'^getContributors/(?P<sid>\d+)/$', views.getContributors, name='getContributors'),
	url(r'^getCompleted/(?P<sid>\d+)/(?P<n>\d+)/$', views.getNCompleted, name='getNCompleted'),
    url(r'^getIncompleted/(?P<sid>\d+)/(?P<n>\d+)/$', views.getNIncompleted, name='getNIncompleted'),
    url(r'^getActive/(?P<sid>\d+)/(?P<n>\d+)/$', views.getNActive, name='getNActive'),
    url(r'^getLikesStory/(?P<sid>\d+)/$', views.getLikesStory, name='getLikesStory'),
    url(r'^getLikesUser/(?P<uid>\d+)/$', views.getLikesUser, name='getLikesUser'),
    url(r'^(?P<username>\w+)/getUserByName/$', views.getUserByName, name='getUserByName'),
    url(r'^getUserByRequest/$', views.getUserByRequest, name='getUserByRequest'),
    url(r'^img/(?P<username>\w+)/$', views.getImage, name='getImage'),
	url(r'^(?P<uid>\d+)/getNumContributions/$', views.getNumContributions, name='getNumContributions'),
    url(r'^(?P<uid>\d+)/getNumStories/$', views.getNumStories, name='getNumStories'),
	url(r'^(?P<uid>\d+)/getUser/(?P<cid>\d+)/$', views.getUser, name='getUser'),
    url(r'^addToStory/(?P<sid>\d+)/(?P<bid>\d+)/$', views.addToStory, name='addToStory'),
    url(r'^setOpen/(?P<sid>\d+)/$', views.setOpen, name='setOpen'),
    url(r'^setClosed/(?P<sid>\d+)/$', views.setClosed, name='setClosed'),
    url(r'^setComplete/(?P<sid>\d+)/$', views.setComplete, name='setComplete'),
    url(r'^setIncomplete/(?P<sid>\d+)/$', views.setIncomplete, name='setIncomplete'),
    url(r'^(?P<uid>\d+)/like/(?P<sid>\d+)/$', views.like, name='like'),
    url(r'^(?P<uid>\d+)/unlike/(?P<sid>\d+)/$', views.unlike, name='unlike'),
    url(r'^deleteBranch/(?P<sid>\d+)/(?P<bid>\d+)/$', views.deleteBranch, name='deleteBranch'),
    url(r'^deleteStory/(?P<sid>\d+)/$', views.deleteStory, name='deleteStory'),
    url(r'^addSReads/(?P<sid>\d+)/$', views.addSReads, name='addSReads'),
    url(r'^addBReads/(?P<bid>\d+)/$', views.addBReads, name='addBReads'),
    url(r'^(?P<uid>\d+)/createStory/$', views.createStory, name='createStory'),
    url(r'^(?P<uid>\d+)/addToReadLater/(?P<sid>\d+)/$', views.addToReadLater, name='addToReadLater'),
    url(r'^(?P<uid>\d+)/removeFromReadLater/(?P<sid>\d+)/$', views.removeFromReadLater, name='removeFromReadLater'),
    url(r'^addImage/$', views.addImage, name='addImage'), 
    url(r'^makeUsers/(?P<n>\d+)/$', views.makeUsers, name='makeUsers'),
    url(r'^populateLikes/$', views.populateLikes, name='populateLikes'), 
]