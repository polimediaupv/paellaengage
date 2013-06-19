<?php

$fileName = "userdata.dat";
$operatingSystem = $_GET['os'];
$browser = $_GET['browser'];
$os_version = $_GET['osVersion'];
$browser_version = $_GET['browserVersion'];
$load_time = $_GET['loadTime'];
$ip = $_SERVER['REMOTE_ADDR'];
$today = getdate();
$date = $today["mday"] . "-" . $today["mon"] . "-" . $today["year"] . " " . $today["hours"] . ":" . $today["minutes"] . ":" . $today["seconds"];

$exists = file_exists($fileName);
$file = fopen($fileName,"a");
if ($file) {
	if (!$exists) {
		$line = "IP ADDRESS,OPERATING SYSTEM,OS VERSION,BROWSER,BROWSER VERSION,LOAD TIME,DATE\n";
		fwrite($file,$line,strlen($line));
	}
	$line = "$ip,$operatingSystem,$os_version,$browser,$browser_version,$load_time,$date\n";
	fwrite($file, $line, strlen($line));
	fclose($file);
}

?>