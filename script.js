// JavaScript source code

"use strict";

async function playSongsByLocation() {
    //console.log('In playSongsByLocation');
    await getLocation().then(async function (geoPoint) {
        //console.log('Obtained Location');
        //console.log(geoPoint);
        await getConcert(geoPoint).then(async function (concertData) {
            //console.log('Obtained Concert');
            //console.log(concertData);
            if (concertData != null) {
                var eventData = concertData._embedded.events;
                eventData.sort((a, b) => (a.dates.start.localDate > b.dates.start.localDate) ? 1 : -1)

                // First we will display the events in the website
                displayConcert(eventData);

                
            } else {
                console.log('No concert in this location');
                alert('No concert in this location');
            }
        }).catch(function (err) {
            console.log(err);
            alert('Error while retrieving the concert data : ' + err);
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
    // console.log(eventData)
    var parentDiv = document.getElementById('concert_group');
    parentDiv.innerHTML = '';

    for (var i = 0; i < eventData.length; i++) {
        var iEvent = eventData[i];
        var childDiv = document.createElement('div');
        childDiv.id = i;
        childDiv.classList.add('concert');
        childDiv.onclick = function () {
            var selectedArtistName = getSelectedText();
            alert('Selected artist : ' + selectedArtistName);
            var maxSize = 10;
            playSongsBasedOnArtistName(selectedArtistName, maxSize);
        }

        var concertTable = document.createElement('table');
        var concertRow1 = document.createElement('tr');
        var td1 = document.createElement('td'); td1.innerHTML = 'Artist Name';
        var td2 = document.createElement('td'); td2.innerHTML = iEvent.name;
        //var td3 = document.createElement('td');
        var artistNameModBox = document.createElement('input'); artistNameModBox.type = 'text'; artistNameModBox.value = iEvent.name;
        concertRow1.appendChild(td1);
        concertRow1.appendChild(td2);
        //td3.appendChild(artistNameModBox[i]);
        //concertRow1.appendChild(td3);
        concertTable.appendChild(concertRow1);

        var concertRow2 = document.createElement('tr');
        var td1 = document.createElement('td'); td1.innerHTML = 'Date';
        var td2 = document.createElement('td'); td2.innerHTML = iEvent.dates.start.localDate + ' - ' + iEvent.dates.start.localTime;
        //var td3 = document.createElement('td'); td3.innerHTML = iEvent.dates.start.localTime;
        concertRow2.appendChild(td1);
        concertRow2.appendChild(td2);
        //concertRow2.appendChild(td3);
        concertTable.appendChild(concertRow2);

        var concertRow3 = document.createElement('tr');
        var td1 = document.createElement('td'); td1.innerHTML = 'Distance';
        var td2 = document.createElement('td'); td2.innerHTML = iEvent.distance;
        concertRow3.appendChild(td1);
        concertRow3.appendChild(td2);
        /*var td3 = document.createElement('td');
        var playSongButton = document.createElement('input'); playSongButton.type = 'button'; playSongButton.value = 'Play';
        playSongButton.onclick = function () {
            alert(artistNameModBox[i]);
            playSongsForConcert(artistNameModBox[i].value);
            // playSongsBasedOnArtistName(artistName, maxSize);
        }
        td3.appendChild(playSongButton);
        concertRow3.appendChild(td3);*/
        
        concertTable.appendChild(concertRow3);

        childDiv.appendChild(concertTable);
        parentDiv.appendChild(childDiv);
    }
}

async function playSongsBasedOnArtistName(artistName, maxSize) {
    var songsList = [];
    let baseURL = "https://cors-anywhere.herokuapp.com/http://api.deezer.com/search?";
    let queryURL = baseURL + '&q=artist:"' + artistName + '"&output=json';
    await fetch(queryURL).then(function (resp) {
        resp.json().then(function (myJson) {
            songsList = myJson.data;
            if (songsList.length != 0) {
                //console.log(songsList)
                //console.log(maxSize)
                playSongsShuffled(songsList, maxSize);
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

function myShuffle(myArray) {
    var arrayLen = myArray.length;
    var tempVar;
    var myRandInt;
    while (arrayLen) {
        myRandInt = Math.floor(Math.random() * arrayLen);
        arrayLen = arrayLen - 1;
        tempVar = myArray[arrayLen];
        myArray[arrayLen] = myArray[myRandInt];
        myArray[myRandInt] = tempVar;
    }
    return myArray;
}

function getSelectedText() {
    var txt = '';
    if (window.getSelection) {
        txt = window.getSelection();
    }
    else if (document.getSelection) {
        txt = document.getSelection();
    }
    else if (document.selection) {
        txt = document.selection.createRange().text;
    }
    else return;
    return txt;
}

function myOnload() {
    function onPlayerLoaded() {
        // console.log('Player is loaded');
        var myFavTracks = [698905582, 744266592, 447098092, 710164312, 771196602];
        var myFavAlbum = 100856872;
        DZ.player.playTracks(myFavTracks);
        // DZ.player.playAlbum(myFavAlbum);
        DZ.player.play();
    }

    DZ.init({
        appId: '8',
        channelUrl: 'http://developers.deezer.com/examples/channel.php',
        player: {
            container: 'player',
            cover: true,
            playlist: true,
            // width: 650,
            height: 200,
            // layout: "light"
            onload: onPlayerLoaded
        }
    });
}