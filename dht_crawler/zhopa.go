package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
	"github.com/shiyanhui/dht"
)

type fileEntry struct {
	Path   string `json:"path"`
	Length int    `json:"length"`
}

type record struct {
	Infohash string      `json:"infohash"`
	Name     string      `json:"name"`
	Length   *int        `json:"length,omitempty"`
	Files    []fileEntry `json:"files,omitempty"`
	Ts       int64       `json:"ts"`
}

func buildRecord(infohash string, meta []byte) *record {
	val, err := dht.Decode(meta)
	if err != nil {
		return nil
	}
	dict, ok := val.(map[string]interface{})
	if !ok {
		return nil
	}
	name, _ := dict["name"].(string)
	r := &record{Infohash: infohash, Name: name}

	if length, ok := dict["length"].(int); ok {
		r.Length = &length
	} else if filesList, ok := dict["files"].([]interface{}); ok {
		for _, f := range filesList {
			fmap, ok := f.(map[string]interface{})
			if !ok {
				continue
			}
			length, _ := fmap["length"].(int)
			var path string
			if pathList, ok := fmap["path"].([]interface{}); ok {
				for i, p := range pathList {
					if i > 0 {
						path += "/"
					}
					path += fmt.Sprint(p)
				}
			}
			r.Files = append(r.Files, fileEntry{Path: path, Length: length})
		}
	}
	r.Ts = time.Now().Unix()
	return r
}

func main() {
	downloader := dht.NewWire(65535, 500, 24)
	go func() {
		for resp := range downloader.Response() {
			r := buildRecord(hex.EncodeToString([]byte(resp.InfoHash)), resp.MetadataInfo)
			if r == nil || (r.Length == nil && len(r.Files) == 0) {
				continue
			}
			line, err := json.Marshal(r)
			if err != nil {
				continue
			}
			fmt.Println(string(line))
		}
	}()
	go downloader.Run()

	config := dht.NewCrawlConfig()
	config.Address = ":6882"
	config.OnAnnouncePeer = func(infoHash, ip string, port int) {
		downloader.Request([]byte(infoHash), ip, port)
	}
	d := dht.New(config)

	d.Run()
}
