plugins.moodleversion = {

    html: null,

    start: function() {
        dashletbase = ('<div class="plugin" id="moodleversion"> \
                <h1>Moodle Version Sitrep</h1> \
                <div class="lastchange"></div> \
                </div>');
        $('div#body').append(dashletbase);
        $.getScript(base_url + '/plugin/moodleversion/jquery.timeago.js');
    },

    receiveData: function(data) {
        // Check for an array message (is array?)
        if ($.isArray(data)) {
            // Only care about the newest message
            data = data.pop();
        }

        var dashletdiv = $('div#moodleversion');
        var existing = $('li', dashletdiv).clone();


        // Last change
        var lastchange = $('div.lastchange', dashletdiv);
        if (data['lastchange']) {
            var c = new Date();
            c.setTime(data['lastchange'] * 1000);
            lastchange.html('Last change: '+c.toDateString()+' '+c.toTimeString());
        }

        for (version in data['moodleinfo']) { //eg v in (1.9, 2.1 ...)
            var versioninfo = data['moodleinfo'][version] // Info about this version of moodle.
            divid = 'moodleversion' + version // eg moodleversion1.9
            escapeddivid = jq( divid ) // To escape any '.', ':' etc.
            var versiondiv = $( '#' + escapeddivid )
            var newversiondiv = $('<div id="'+divid+'"><span class="versiontitle">'+version+'</span></div>');

            if (versiondiv.length == 0) {
                // There was no div of that id in dashletdiv.
                // Create one.
                dashletdiv.append(newversiondiv) // Put the new versiondiv at the end of the dashlet content.
                versiondiv = newversiondiv
            } else {
                // Clear out the existing one.
                versiondiv.replaceWith(newversiondiv)
                versiondiv = newversiondiv
            }
            // Apply a class to version title, to facilitiate styling it with css.
            var versiontitle = $( 'div#' + escapeddivid + ' .versiontitle' )
            if (versioninfo.supportdays <= 0) {
                versiontitle.addClass('Critical')
            } else if (versioninfo.supportdays < 90) {
                versiontitle.addClass('Warning')
            } else {
                versiontitle.addClass('OK')
            }

            var supportstring = ''
            if (versioninfo.supportdays > 0) {
                supportstring = ' Security support ends in ' + versioninfo.supportdays + ' day'
                if (versioninfo.supportdays > 0) {
                    supportstring = supportstring + 's' // Plural
                }
                supportstring = supportstring + '.'
            } else {
                supportstring = ' Security support ended ' + (-versioninfo.supportdays)
                if (versioninfo.supportdays == 0) {
                    supportstring = supportstring + ' today.'
                } else if (versioninfo.supportdays == -1) {
                    supportstring = supportstring + ' day ago.'
                } else { // ie (versioninfo.supportdays < -1) {
                    supportstring = supportstring + ' days ago.'
                }
            }
            supportstring = '<span class="supportperiod">' + supportstring + '</span>'
            var supportspan = $( 'div#' + escapeddivid + ' span.supportperiod' )
            if (supportspan.length == 0) {
                // There isn't any existing supportspan; create one.
                versiondiv.append(supportstring)
            } else {
                // Replace the existing span with the new one.
                supportspan.replaceWith(supportstring)
            }

            var latestreleaseinfo = '<span class="latestrelease">LSR: ' + versioninfo.latestsecurity + '.</span>'
            versiondiv.append(latestreleaseinfo)
            var sitesonlatest = '<span class="latestcount">SE-LSR: ' + versioninfo.onlatestsecurity + '.</span>'
            versiondiv.append(sitesonlatest)

            // Create a section 'lagging div' to describe if there are any sites lagging behind the latest security release, and which ones.
            var laggingsites = versioninfo.behindlatest
            var laggingdiv = '<div class="behindlatest"><span class="laggingsummary">'
            if (laggingsites.length == 0) {
                    laggingdiv = laggingdiv + '<span class="laggingcount OK">SE!LSR:0</span>'
            } else {
                if (laggingsites.length == 1) {
                    laggingdiv = laggingdiv + '<span class="laggingcount CRITICAL">SE!LSR:1</span>'
                } else {
                    laggingdiv = laggingdiv + '<span class="laggingcount CRITICAL">SE!LSR' + laggingsites.length + '</span>'
                }
            }
            laggingdiv = laggingdiv + '</span></div>'
            versiondiv.append(laggingdiv)
            if (laggingsites.length) {
                // There is at least one site lagging behind the latest security release. Add an unnumbered list to this div.
                var laggingdiv = $( 'div#' + escapeddivid + ' div.behindlatest' )
                var lagginglist = '<ul></ul>'
                laggingdiv.append(lagginglist)
                var laggingdiv = $( 'div#' + escapeddivid + ' div.behindlatest' )
                lagginglist = $( 'ul', laggingdiv )
    
                for (i in laggingsites) {
                    var laggingsite = laggingsites[i]
                    laggingstring = '<li><span class="laggingsite">' + laggingsite.dbname + '</span> ( <span class="laggingversion">' + laggingsite.version + '</span> )</li>'
                    lagginglist.append(laggingstring)
                }
            }
        }
    }
}

// Escape dom 'id' values - replace '.' with '\\.'.
function jq( myid ) {
    return myid.replace( /(:|\.|\[|\]|,)/g, "\\$1" );
}
