// JavaScript source code

"use strict";

async function playSongsByLocation() {
    await getLocation().then(async function (geoPoint) {
        await getConcert(geoPoint).then(async function (concertData) {
            if (concertData != null) {
                var eventData = concertData._embedded.events;
                localStorage.setItem('concert_event', JSON.stringify(eventData));
                displayConcert(eventData);
            } else {
                console.log('No concert in this location');
                alert('No concert in this location');
            }
        }).catch(function (err) {
            console.log(err);
            alert('Error while retrieving the concert data. Either the location is not correctly formatted or there are no concerts in this location.');
        });
    }).catch(function (err) {
        console.log(err);
        alert('The location - ' + document.getElementById("location").value + ' is invalid');
    });
}

async function getLocation() {
    let address = document.getElementById("location").value;
    if (address != "") {
        // Fetch coordinates from opencagedata API and encode into geohash format
        var loc_data = await fetch("https://api.opencagedata.com/geocode/v1/json?key=5e51b888e28648ea94b4e50c8600e66f&q=" + address)
            .then((resp) => resp.json());
        var geoPoint = Geohash.encode(loc_data.results[0].geometry.lat, loc_data.results[0].geometry.lng, 9);
        return geoPoint;
    } else {
        alert('Must enter a location');
        throw "Must enter a location";
    }
}

async function getConcert(geoPoint) {
    let radius = document.getElementById("radius").value;
    if (radius != "") {
        // Fetch tickets from ticketmaster API and log data
        var concert_data = await fetch("https://app.ticketmaster.com/discovery/v2/events.json?apikey=wtppGRYqiacaBEoumNx2xCBNb3QqwCtf&size=100&classificationName=music&geoPoint="
            + geoPoint + "&radius=" + radius + "&unit=miles")
            .then((resp) => resp.json());
        return concert_data;
    } else {
        alert('Must enter a radius');
        throw "Must enter a radius";
    }
}

function displayConcert(eventData) {
    // Sort the events
    var sortParam = document.getElementById('sort_parameter').value.toLowerCase();
    if (sortParam == 'date') {
        eventData.sort((a, b) => (a.dates.start.localDate > b.dates.start.localDate) ? 1 : -1);
    } else {
        eventData.sort((a, b) => (a.distance > b.distance) ? 1 : -1);
    }
    
    var parentDiv = document.getElementById('concert_list');
    parentDiv.innerHTML = '';

    for (var i = 0; i < eventData.length; i++) {
        var iEvent = eventData[i];
        var childDiv = document.createElement('div');
        childDiv.id = 'concert_' + i;
        childDiv.classList.add('concert');
        localStorage.setItem(childDiv.id, JSON.stringify(iEvent));
        childDiv.onclick = function () {
            var maxSize = 5;
            var selectedConcert = JSON.parse(localStorage.getItem(this.id));
            var selectedArtistName = displaySelectedConcert(selectedConcert);
            playSongsBasedOnArtistName(selectedArtistName, maxSize);
        }

        var divDate = document.createElement('div');
        divDate.innerHTML = iEvent.dates.start.localDate;
        divDate.classList.add('concert_date');
        var divName = document.createElement('div');
        divName.innerHTML = iEvent.name;
        divName.classList.add('concert_name');
        var divTime = document.createElement('div');
        divTime.innerHTML = iEvent.dates.start.localTime;
        divTime.classList.add('concert_time');
        var divVenue = document.createElement('div');
        divVenue.innerHTML = iEvent._embedded.venues[0].address.line1 + ', ' + iEvent._embedded.venues[0].city.name + ', '
            + iEvent._embedded.venues[0].state.stateCode + ', ' + iEvent._embedded.venues[0].postalCode;
        divVenue.classList.add('concert_venue');

        childDiv.appendChild(divDate);
        childDiv.appendChild(divName);
        childDiv.appendChild(divTime);
        childDiv.appendChild(divVenue);

        parentDiv.appendChild(childDiv);
        parentDiv.appendChild(document.createElement('hr'));
    }
}

function displaySelectedConcert(selectedConcert) {
    var selectedConcertDiv = document.getElementById('concert_selected');
    selectedConcertDiv.innerHTML = '';
    var concertName = document.createElement('div');
    concertName.classList.add('selected_concert_name');
    concertName.innerHTML = selectedConcert.name;
    selectedConcertDiv.appendChild(concertName);
    selectedConcertDiv.appendChild(document.createElement('hr'));

    var genreDiv = document.createElement('div');
    genreDiv.classList.add('concert_selected_details');
    var genreNameDiv = document.createElement('div');
    genreNameDiv.innerHTML = 'Genre';
    var genreValDiv = document.createElement('div');
    genreValDiv.innerHTML = selectedConcert.classifications[0].genre.name;
    genreDiv.appendChild(genreNameDiv);
    genreDiv.appendChild(genreValDiv);
    selectedConcertDiv.appendChild(genreDiv);

    var artistDiv = document.createElement('div');
    artistDiv.classList.add('concert_selected_details');
    var artistNameDiv = document.createElement('div');
    artistNameDiv.innerHTML = 'Artist(s)';
    var artistValDiv = document.createElement('div');

    var artistNameList = '';
    var selectedArtistName = [];
    if (selectedConcert.hasOwnProperty('_embedded') && selectedConcert._embedded.hasOwnProperty('attractions') && selectedConcert._embedded.attractions.length != 0 && selectedConcert._embedded.attractions[0].hasOwnProperty('name')) {
        selectedArtistName = selectedConcert._embedded.attractions[0].name;
        for (var i = 0; i < selectedConcert._embedded.attractions.length; i++) {
            artistNameList = artistNameList + selectedConcert._embedded.attractions[i].name + '<br>';
        }
    } else {
        selectedArtistName = selectedConcert.name;
        artistNameList = selectedArtistName;
    }
    artistValDiv.innerHTML = artistNameList;
    artistDiv.appendChild(artistNameDiv);
    artistDiv.appendChild(artistValDiv);
    selectedConcertDiv.appendChild(artistDiv);

    if (selectedConcert.images.length != 0) {
        var concertImage = document.createElement('img');
        concertImage.classList.add('selected_concert_image');
        var imageURL = selectedConcert.images[0].url;
        concertImage.setAttribute('src', imageURL);
        selectedConcertDiv.appendChild(concertImage);
    }
    return selectedArtistName;
}

async function playSongsBasedOnArtistName(artistName, maxSize) {
    var songsList = [];
    let baseURL = "https://cors-anywhere.herokuapp.com/http://api.deezer.com/search?";
    let queryURL = baseURL + '&q=artist:"' + artistName + '"&order=RANKING&limit=' + maxSize + '&output=json';
    await fetch(queryURL).then(function (resp) {
        resp.json().then(function (myJson) {
            songsList = myJson.data;
            if (songsList.length != 0) {
                playSongs(songsList);
            } else {
                alert('No songs found for the artist : ' + artistName + '. Either the name of the artist is wrong or we do not have any records in our database.')
            }
        })
    });
}

function playSongsShuffled(songsList, maxSize) {
    songsList = myShuffle(songsList);
    if (songsList.length > maxSize) {
        songsList = songsList.slice(0, maxSize);
    } else {
        // console.log("The data is smaller than the requested size");
    }
    playSongs(songsList);
}

function playSongs(songsList) {
    let idList = Array(songsList.length);
    for (var i = 0; i < songsList.length; i++) {
        idList.push(songsList[i].id);
    }
    DZ.player.playTracks(idList);
}

function sortEvents(sortDropdown) {
    console.log(sortDropdown.value);
    var eventData = JSON.parse(localStorage.getItem('concert_event'));
    displayConcert(eventData);
}

function myOnload() {
    function onPlayerLoaded() {
        var myFavTracks = [698905582, 744266592, 447098092, 710164312, 771196602];
        DZ.player.playTracks(myFavTracks);
        DZ.player.play();
    }

    DZ.init({
        appId: '8',
        channelUrl: 'http://developers.deezer.com/examples/channel.php',
        player: {
            container: 'player',
            cover: true,
            playlist: true,
            height: 200,
            layout: "light",
            onload: onPlayerLoaded
        }
    });
}