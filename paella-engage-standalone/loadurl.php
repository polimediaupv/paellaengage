<?php

$url = $_GET['url'];

$separator = '?';
foreach($_GET as $name=>$value) {
	if ($name!='url') {
		$url .= $separator . $name . '=' . $value;
		$separator = '&';
	}
}

$f = fopen($url,'r');
if ($f) {
	while(!feof($f)) {
		echo(fgets($f));
	}
	fclose($f);
}



?>