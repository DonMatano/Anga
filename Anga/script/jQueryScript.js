/*
    A map used to store the digits of the temperature in celcius and farenheit(which has already being converted)
*/
var weatherDegrees = new Map();

$(document).ready(function() {
    $("[name='my-checkbox']").bootstrapSwitch();

    init();

    // Set listener for button Switch

    $("#buttonSwitch").on("switchChange.bootstrapSwitch", function(event, state) {
        //Check if the weather data has been loaded by checking if the 
        // temp digit has already been loaded.
        if ($("#todayTempNumber").text()) {
            if (!state) {
                changeToFarenheit();
            } else {
                changeToCelcius();
            }
        }
    });

    // Set listener for screen size change
    $(window).on("resize", function() {
        var size = $(window).width(); //Get size of the screen

        if (size > 768) {
            $(".collapsablePanel").removeClass("panel-collapse").addClass("in");
            $(".sidePanel").removeAttr("data-toggle");
        } else {
            $(".collapsablePanel").addClass("panel-collapse collapse").removeClass("in");
            $(".sidePanel").attr("data-toggle", "collapse");

        }

    }).resize();

    // Set Listeners for the collapsable panels so that we can change the icon of open and close
    $("#weatherInfoContent").on("hide.bs.collapse", function() {
        $("#weatherInfoPanel").children("h3").children("span").removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
    });

    $("#weatherInfoContent").on("show.bs.collapse", function() {
        $("#weatherInfoPanel").children("h3").children("span").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
    });

    $("#forecastContent").on("hide.bs.collapse", function() {
        $("#forecastPanel").children("h3").children("span").removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
    });

    $("#forecastContent").on("show.bs.collapse", function() {
        $("#forecastPanel").children("h3").children("span").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
    });

});

function init() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            getLocationName(position.coords.latitude, position.coords.longitude);
            getLocationWeather(position.coords.latitude, position.coords.longitude);
        });
    } else {
        console.log("Navigitor.geolocation is not available")
    }
}
/**
get the name of the location. This is done by using the the google.maps.Geocoder api.
params:-  latitude and longitude of the location.
**/

function getLocationName(latitude, longitude) {
    var geocoder = new google.maps.Geocoder;
    var latlng = { lat: latitude, lng: longitude };
    geocoder.geocode({ 'location': latlng }, function(results, status) {
        if (status === 'OK') {
            if (results[4]) {
                $("#locationRow").text(results[4].formatted_address);
            } else {
                window.alert('No results found');
            }
        }
    });
}

function getLocationWeather(latitude, longitude) {
    var url = "https://api.darksky.net/forecast/177d7fcef80e6bcb3364c6cc14ffdb0f/" + latitude + "," + longitude + "?units=si&exclude=minutely,hourly/";
    $.ajax({

        url: url,
        type: 'GET',
        data: {},
        dataType: 'jsonp',
        success: function(data) {
            setSkyConsIcons("animatedIcon", data.currently.icon); // set the icon of the Weather panel.
            // showSkyConsIcons(data.currently.icon);
            $(".summary").text(data.currently.summary);
            $("#todayTempNumber").text(Math.floor(data.currently.temperature));
            weatherDegrees.set("today temp in C", Math.floor(data.currently.temperature));
            weatherDegrees.set("today temp in F", convertToFahrenheit(data.currently.temperature));
            // set max Temp and Min temp of the day which is only available in the daily data array.
            $("#maxTemp").text(Math.floor(data.daily.data[0].temperatureMax));
            weatherDegrees.set("today maxTemp in C", Math.floor(data.daily.data[0].temperatureMax));
            weatherDegrees.set("today maxTemp in F", convertToFahrenheit(data.daily.data[0].temperatureMax));

            $("#minTemp").text(Math.floor(data.daily.data[0].temperatureMin));
            weatherDegrees.set("today minTemp in C", Math.floor(data.daily.data[0].temperatureMin));
            weatherDegrees.set("today minTemp in F", convertToFahrenheit(data.daily.data[0].temperatureMin));
            setMoreWeatherPanel(data.currently); // Send today's data 
            setForeCastPanel(data.daily.data); //Send this week's data


            // Check the state of the switch and update digits accordingly
            if (!$("#buttonSwitch").prop("checked")) {
                changeToFarenheit();
            }
        },
        error: function(err) { alert(err.toString()); }
    });
}




/*
    variable multiplied by 100 because we want to get the percentage.
*/
function setMoreWeatherPanel(todayWeather) {
    $("#windSpeed").text(Math.floor(todayWeather.windSpeed));
    $("#cloudCover").text(Math.floor(todayWeather.cloudCover * 100));
    $("#humidity").text(Math.floor(todayWeather.humidity * 100));
    $("#pressure").text(Math.floor(todayWeather.pressure));
    $("#precipProbability").text(Math.floor(todayWeather.precipProbability * 100));
    $("#uvIndex").text(todayWeather.uvIndex);
}

function setForeCastPanel(weatherDaysArray) {
    //show tomorrow's weather
    setSkyConsIcons("tomorrowWeatherIcon", weatherDaysArray[1].icon);
    //get tommorrow's temperature by averaging tomorrow's max temp and min temp.
    $("#tomorrowTemp").text(Math.floor((weatherDaysArray[1].temperatureMax + weatherDaysArray[1].temperatureMin) / 2));
    weatherDegrees.set("tomorrow temp in C", Math.floor((weatherDaysArray[1].temperatureMax + weatherDaysArray[1].temperatureMin) / 2));
    weatherDegrees.set("tomorrow temp in F", convertToFahrenheit((weatherDaysArray[1].temperatureMax + weatherDaysArray[1].temperatureMin) / 2));

    //Set rest of the week weather. Excludes Monday of the next week
    for (var i = 2; i < weatherDaysArray.length - 1; i++) {
        var canvasId = "daysWeatherIcon" + i;
        var tempDigitsID = "tempDigit" + i;
        var html = '<li class="list-group-item"> ';
        html += '<div class="row"> <span class="col-xs-6 col-sm-6 col-md-6">';
        html += getDay(new Date(weatherDaysArray[i].time * 1000).getDay()); //Multiply by 1000 to get the milliseconds from the seconds
        html += ' </span> <span class="col-xs-3 col-sm-3 col-md-3 col-lg-3" id = "' + tempDigitsID + '"></span> <span class="';
        html += 'col-xs-3 col-sm-3 col-md-3 col-lg-3">';
        html += ' <canvas id="' + canvasId + '" width="40" height="40"> </canvas> </span> </div></li>';

        $("#listOfWeatherForecast").append(html);

        setSkyConsIcons(canvasId, weatherDaysArray[i].icon);
        $("#" + tempDigitsID).text(Math.floor((weatherDaysArray[i].temperatureMax + weatherDaysArray[i].temperatureMin) / 2));

        weatherDegrees.set("day " + i + " temp in C", Math.floor((weatherDaysArray[i].temperatureMax + weatherDaysArray[i].temperatureMin) / 2));
        weatherDegrees.set("day " + i + " temp in F", convertToFahrenheit((weatherDaysArray[i].temperatureMax + weatherDaysArray[i].temperatureMin) / 2));
    }

}


function setSkyConsIcons(canvasId, iconName) {
    var skyIcon = new Skycons({ "color": "white" });
    skyIcon.add(canvasId, iconName);
    skyIcon.play();
}

function getDay(numberOfDayOfWeek) {
    switch (numberOfDayOfWeek) {
        case 0:
            return "Sunday";
            break;

        case 1:
            return "Monday";
            break;

        case 2:
            return "Tuesday";
            break;

        case 3:
            return "Wednesday";
            break;

        case 4:
            return "Thursday";
            break;

        case 5:
            return "Friday";
            break;

        case 6:
            return "Saturday";
            break;

        default:
            return "Day Unavailable";
            break;
    }
}

function changeToFarenheit() {
    $(".units").text("\u2109");
    $("#todayTempNumber").text(weatherDegrees.get("today temp in F"));
    $("#maxTemp").text(weatherDegrees.get("today maxTemp in F"));
    $("#minTemp").text(weatherDegrees.get("today minTemp in F"));
    $("#tomorrowTemp").text(weatherDegrees.get("tomorrow temp in F"));

    for (var i = 2; i < 7; i++) {
        $("#tempDigit" + i).text(weatherDegrees.get("day " + i + " temp in F"));
    }
}

function changeToCelcius() {
    $(".units").text("\u2103");
    $("#todayTempNumber").text(weatherDegrees.get("today temp in C"));
    $("#maxTemp").text(weatherDegrees.get("today maxTemp in C"));
    $("#minTemp").text(weatherDegrees.get("today minTemp in C"));
    $("#tomorrowTemp").text(weatherDegrees.get("tomorrow temp in C"));

    for (var i = 2; i < 7; i++) {
        $("#tempDigit" + i).text(weatherDegrees.get("day " + i + " temp in C"));
    }
}

function convertToFahrenheit(temp) {
    return Math.floor((temp * 1.8) + 32);
}
