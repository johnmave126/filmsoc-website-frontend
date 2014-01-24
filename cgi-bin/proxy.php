#!/usr/local/bin/php
<?php

if (!function_exists('http_parse_headers'))
{
    function http_parse_headers($raw_headers)
    {
        $headers = array();
        $key = ''; // [+]

        foreach(explode("\n", $raw_headers) as $i => $h)
        {
            $h = explode(':', $h, 2);

            if (isset($h[1]))
            {
                if (!isset($headers[$h[0]]))
                    $headers[$h[0]] = trim($h[1]);
                elseif (is_array($headers[$h[0]]))
                {
                    // $tmp = array_merge($headers[$h[0]], array(trim($h[1]))); // [-]
                    // $headers[$h[0]] = $tmp; // [-]
                    $headers[$h[0]] = array_merge($headers[$h[0]], array(trim($h[1]))); // [+]
                }
                else
                {
                    // $tmp = array_merge(array($headers[$h[0]]), array(trim($h[1]))); // [-]
                    // $headers[$h[0]] = $tmp; // [-]
                    $headers[$h[0]] = array_merge(array($headers[$h[0]]), array(trim($h[1]))); // [+]
                }

                $key = $h[0]; // [+]
            }
            else // [+]
            { // [+]
                if (substr($h[0], 0, 1) == "\t") // [+]
                    $headers[$key] .= "\r\n\t".trim($h[0]); // [+]
                elseif (!$key) // [+]
                    $headers[0] = trim($h[0]);trim($h[0]); // [+]
            } // [+]
        }

        return $headers;
    }
}

$url = "dma005.resnet.ust.hk";
$port = "49000";
$path_prefix = "/film/static/";
$path = $path_prefix . urldecode($_GET["_escaped_fragment_"]);
$path_canonical = false;

do {
	$oldpath = $path;
	$path = str_replace(" ", "%20", $path);
	$path = str_replace("/\.\./", "/", $path);
	$path = str_replace("/\./", "/", $path);
    $path = preg_replace("/\/\.\.$/", "/", $path);
	$path = preg_replace("/\/{2,}/", "/", $path);
}while($path != $oldpath);
if (substr($path, -1) !== "/" && strpos($path, "?") == false) {
    $path .= "/";
    $path_canonical = true;
}

$valid_headers = array(
	"Content-Type",
	"Date",
	"Expires",
	"Last-Modified",
	"Pragma",
	"Vary",
    "Location",
	"Transfer-Encoding"
);

//Send Request
$fp = fsockopen($url, $port, $errno, $errstr, 30);
if (!$fp) {
	header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
	die("Error[$errno]: $errstr");
}
fwrite($fp,"GET $path HTTP/1.1\r\n");
fwrite($fp,"Host: $url:$port\r\n");
fwrite($fp,"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\r\n");
fwrite($fp,"Connection:close\r\n\r\n");
$ret = "";
//Retrieve and Deliver
while (!feof($fp)){
	$ret .= fgets($fp, 4096);
}
list($header, $body) = explode("\r\n\r\n", $ret, 2);
$header_arr = http_parse_headers($header);

//Send Status
list($protocol, $status_code, $status_text) = explode(' ', $header_arr[0], 3);
header($header_arr[0], true, intval($status_code));

//Check headers
foreach($header_arr as $k => $v) {
	if ($k === 0) {
		continue;
	}
	if (in_array($k, $valid_headers)) {
		if (is_array($v)) {
			$v = implode(";", $v);
		}
		header("$k: $v");
	}
}

//Put Canonical
if ($path_canonical) {
    header('Link: <http://ihome.ust.hk/~su_film/#!'.$_GET["_escaped_fragment_"].'/>; rel="canonical"');
}
else if (strlen($_GET["_escaped_fragment_"]) === 0) {
    header('Link: <http://ihome.ust.hk/~su_film/#!home/>; rel="canonical"');
}

//Echo Result
echo $body;
?>