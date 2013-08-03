#!/usr/local/bin/php
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns='lang:zh_cn'>
    <head>
        <title>Sorry, This site doesn't support IE</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="robots" content="noindex, nofollow" />
        <style type="text/css">
        html, body {
            width: 100%;
            text-align: center;
            background-color: #e7e7e7;
            font-family: Tahoma, monospace;
            overflow-x: hidden;
        }
        h3 {
            font-weight: normal;
        }
        #container {
            text-align: center;
        }
        #logo {
            background: url(/~su_film/asset/meme/LOGO_FOR_IE.png) no-repeat;
            /* IE Hack */
            _background: none;
            _filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="/~su_film/asset/meme/LOGO_FOR_IE.png");

            width: 160px;
            height: 160px;
            margin-bottom: 20px;
            margin: 10px auto 10px auto;
        }
        #alternatives span {
            color: #888;
            font-weight: bold;
            margin: 10px auto 5px auto;
        }
        #other-browsers {
            width: 400px;
            margin: 10px auto 5px auto;
        }
        #other-browsers td {
            width: 33%;
            text-align: center;
        }
        #other-browsers td > a {
            margin: 10px auto;
        }
        #other-browsers td > a > div {
            width: 130px;
            height: 130px;
        }
        #chrome > div {
            background: url(/~su_film/asset/meme/chrome.png) no-repeat;
            /* IE Hack */
            _background: none;
            _filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="/~su_film/asset/meme/chrome.png");
        }
        #safari > div {
            background: url(/~su_film/asset/meme/safari.png) no-repeat;
            /* IE Hack */
            _background: none;
            _filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="/~su_film/asset/meme/safari.png");
        }
        #firefox > div {
            background: url(/~su_film/asset/meme/firefox.png) no-repeat;
            /* IE Hack */
            _background: none;
            _filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="/~su_film/asset/meme/firefox.png");
        }
        #reason {
            border: 1px solid #888;
            max-width: 70%;
            margin: 10px auto 10px auto;
        }
        #reason p {
            text-align: left;
            padding-left: 20px;
            padding-right: 20px;
        }
        </style>
    </head>
    <body>
<?php
$meme_array = array(
    "1.jpg",
    "2.jpg",
    "3.png",
    "4.png",
    "5.jpg",
);
$idx = rand(0, sizeof($meme_array) - 1);
$img_url = "http://ihome.ust.hk/~su_film/asset/meme/$meme_array[$idx]";
?>
        <div id="container">
            <div id="logo"></div>
            <h3>Sorry, Internet Explorer doesn't support the technology used on official website of Film Society, HKUSTSU</h3>
            <div id="alternatives">
                <span>To use our site, please try some modern browsers</span>
                <table id="other-browsers">
                    <tbody>
                        <tr>
                            <td>
                                <a id="chrome" title="Google Chrome" href="http://www.google.com/chrome" target="_blank">
                                    <div></div>
                                </a>
                            </td>
                            <td>
                                <a id="safari" title="Safari" href="http://support.apple.com/downloads/#safari" target="_blank">
                                    <div></div>
                                </a>
                            </td>
                            <td>
                                <a id="firefox" title="Firefox" href="http://www.mozilla.org/en-US/firefox/new/" target="_blank">
                                    <div></div>
                                </a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div id="reason">
                <h4>Why IE is Internet Evil</h4>
                <img title="IE sucks" src="<?php echo $img_url; ?>"/>
                <p>IE is one of the worst invention in the history of software developing. An important reason is that it ignores <b>Nearly All Internet Standards</b> which is known as W3C specifications. This makes it difficult to render a beautiful page for users.</p>
                <p>There are also issues in <b>Security</b>. The misuse of charsets and weak implementation of ActiveX give attackers a wide world to play tricks on users.</p>
                <p>IE has a naive core which makes it <b>Very Slow</b>. There are so many overhead that it can take serveral times of time to open a webpage in comparison to other browsers.</p>
                <p>We Film Society want to provide members a best browse experience so we choose not to support IE. We hope you could understand us and choose an alternative modern browser.</p>
            </div>
        </div>
    </body>
</html>