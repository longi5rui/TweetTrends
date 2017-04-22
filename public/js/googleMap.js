var map;
var markers = []; // cache all markers for future deletion

function initMap() {
    var myLatLng = {lat: 43.25942, lng: -3.45777};

    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        scrollwheel: true,
        zoom: 3
    });
}

var socket = io();

socket.on('point', function (data) {
    var tweetIconURL;

    if (data.sentiment == 'positive') {
        tweetIconURL = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    } else if (data.sentiment == 'neutral') {
        tweetIconURL = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    } else if (data.sentiment == 'negative') {
        tweetIconURL = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    }

    // Create a marker and set its position.
    var marker = new google.maps.Marker({
        map: map,
        position: data.latLng,
        draggable: false,
        animation: google.maps.Animation.DROP,
        icon: tweetIconURL,
        title: 'new tweet'
    });

    var contentString = "<b>@" + data.user + "</b><br><div>" + '\"' + data.content + '\"</div>';

    var infowindow = new google.maps.InfoWindow({
        content: contentString,
        maxWidth: 300
    });

    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });

    markers.push(marker);
});

// delete all markers in the map
function deleteAllMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

// add markers according to tweets retrieved from AWS ES
function addMarkerFromES(tweet) {

    var iconURL;

    if (tweet._source.sentiment == 'positive') {
        iconURL = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    } else if (tweet._source.sentiment == 'neutral') {
        iconURL = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    } else if (tweet._source.sentiment == 'negative') {
        iconURL = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    }

    var marker = new google.maps.Marker({
        map: map,
        position: {
          lat: tweet._source.lat,
          lng: tweet._source.lng
        },
        draggable: false,
        animation: google.maps.Animation.DROP,
        icon: iconURL,
        title: 'new tweet'
    });

    var contentString = "<b>@" + tweet._source.user + "</b><br><div>" + '\"' + tweet._source.content + '\"</div>';

    var infowindow = new google.maps.InfoWindow({
        content: contentString,
        maxWidth: 300
    });

    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });

    markers.push(marker);
}

$("#music").click(function() {
    deleteAllMarkers();

    $.get('/api/v1/tweetsWithKeyword/music')
      .success(function (tweets) {
        
        for (var i = 0; i < tweets.length; i++) {
          addMarkerFromES(tweets[i]);
        }

      });
});

$("#trump").click(function() {
    deleteAllMarkers();

    $.get('/api/v1/tweetsWithKeyword/trump')
      .success(function (tweets) {
        
        for (var i = 0; i < tweets.length; i++) {
          addMarkerFromES(tweets[i]);
        }

      });
});

$("#nba").click(function() {
    deleteAllMarkers();

    $.get('/api/v1/tweetsWithKeyword/nba')
      .success(function (tweets) {
        
        for (var i = 0; i < tweets.length; i++) {
          addMarkerFromES(tweets[i]);
        }

      });
});