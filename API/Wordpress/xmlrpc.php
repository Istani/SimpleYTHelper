<?php
class xmlrpc_client {
	private $url;
	function __construct($url, $autoload=true) {
		$this->url = $url;
		$this->connection = new curl;
		$this->methods = array();
		if ($autoload) {
			$resp = $this->call('system.listMethods', null);
			$this->methods = $resp;
		}
	}
	public function call($method, $params = null) {
		$post = xmlrpc_encode_request($method, $params);
		return xmlrpc_decode($this->connection->post($this->url, $post));
	}
}
?>
