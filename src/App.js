import React, { Component } from 'react';
import axios from "axios";
// import logo from './logo.svg';
import './App.css';
import Spotify from 'spotify-web-api-js';
import NoImg from './img/no-img.png';
import Play from '@material-ui/icons/PlayCircleOutlineOutlined';
import Pause from '@material-ui/icons/PauseCircleOutlineOutlined';
import Prev from '@material-ui/icons/SkipPreviousOutlined';
import Next from '@material-ui/icons/SkipNextOutlined';
import VolumeDown from '@material-ui/icons/VolumeDownOutlined';
import VolumeUp from '@material-ui/icons/VolumeUpOutlined';

// import SpotifyPlayer from './util/spotify-player';

// SPOTIFY WEB API
// https://github.com/JMPerez/spotify-web-api-js/blob/master/src/spotify-web-api.js
// https://www.youtube.com/watch?v=prayNyuN3w0&feature=emb_title

// WEB PLAYBACK SDK QUICK START
// https://developer.spotify.com/documentation/web-playback-sdk/quick-start/#
// BQBacbOIFWAYnOB3nCNnaA1AJ5rrO-TLtfLUkKJfUv5ecH7G4Kb4wSr5F42qNzpkQFH2hw26Oz6TYTBaFsMTK9je_JduPZM40HOHoXoCkgPqqk-4kw6YV2lg1tv9fpklmBbYcfbSmujD5nGzPvMYtZCfeA

// it's a class, so instantiate it
const spotifyWebApi = new Spotify();
var resume;
var currentProgress;

class App extends Component {
  constructor(){
    super();
    const params = this.getHashParams();
    this.state = {
      loggedIn: params.access_token ? true : false,
      userInfo: {
        image: ''
      },
      listener: {
        progress: null
      },
      nowPlaying: {
        name: 'Not Checked',
        image: '',
        uri: '',
        progress: null,
        duration: null,
        playing: false,
        album: '',
        albumURI: '',
        albumID: '',
        track: '',
        volume: null
      },
      play: {
        uris: [],
        position: 0
      },
      album: {
        name: '',
        uri: '',
        tracks: []
      }
    }
   
    if (params.access_token){ // If user has logged into Spotify account, allow the webApi to use the access token
      spotifyWebApi.setAccessToken(params.access_token);

      spotifyWebApi.getMe()
      .then((res) => {
        this.setState({
          userInfo: {
            image: res.images[0].url
          }
        })
      })
      const token = spotifyWebApi.getAccessToken()
      console.log(token)
      
    } else {
      const token = spotifyWebApi.getAccessToken()
      console.log(token)
    }
  }

  // from auth-server index.html:71
  // Gives an object with access_token and refresh_token
  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams; 
  }

  getUserInfo() {
    spotifyWebApi.getMe()
      .then((res) => {
        this.setState({
          userInfo: {
            image: res.images[0].url
          }
        })
      })
  }

  componentDidMount(){
    this.getNowPlaying()
    console.log(this.state.nowPlaying.progress)
  }
  
  // Player Methods
  getNowPlaying(){
    spotifyWebApi.getMyCurrentPlaybackState()
      .then((res) => {
        this.setState({
          nowPlaying: {
            name: res.item.name,
            image: res.item.album.images[0].url,
            uri: res.item.uri,
            progress: res.progress_ms,
            duration: res.item.duration_ms,
            playing: res.is_playing,
            album: res.item.album.name,
            albumURI: res.item.album.uri,
            albumID: res.item.album.id,
            track: res.item.track_number,
            volume: res.device.volume_percent
          }
        })
        resume = this.state.nowPlaying.progress
        console.log(this.state.nowPlaying)
      })
      .then(() => this.getAlbum())
  }

  songListener(){

  }

  getAlbum(){
    spotifyWebApi.getAlbum(this.state.nowPlaying.albumID)
    .then((res) => {
      // console.log(res)
      this.setState({
        album: {
          name: res.name,
          uri: res.uri,
          tracks: res.tracks.items
        }
      })
      for(var i=0; i < this.state.album.tracks.length; i++){
        console.log(this.state.album.tracks[i].name)
      }
    })
  }
  
  pauseSong(){
    spotifyWebApi.pause()
      .then( () => {
        spotifyWebApi.getMyCurrentPlaybackState()
        .then((res) => {
          this.setState({
            play: {
              position: res.progress_ms
            },
            nowPlaying: {
              name: res.item.name,
              image: res.item.album.images[0].url,
              uri: res.item.uri,
              progress: res.progress_ms,
              duration: res.item.duration_ms,
              playing: res.is_playing,
              album: res.item.album.name,
              albumURI: res.item.album.uri,
              albumID: res.item.album.id,
              track: res.item.track_number,
              volume: res.device.volume_percent
            }
          })
          resume = res.progress_ms
        })
      })
  }

  playSong(){
    spotifyWebApi.play({
      uris: [this.state.nowPlaying.uri],
      position_ms: resume
    })
    .then( () => {
      spotifyWebApi.getMyCurrentPlaybackState()
      .then((res) => {
        this.setState({
          play: {
            position: res.progress_ms
          },
          nowPlaying: {
            name: res.item.name,
            image: res.item.album.images[0].url,
            uri: res.item.uri,
            progress: res.progress_ms,
            duration: res.item.duration_ms,
            playing: res.is_playing,
            album: res.item.album.name,
            albumURI: res.item.album.uri,
            albumID: res.item.album.id,
            track: res.item.track_number,
            volume: res.device.volume_percent
          }
        })
        resume = res.progress_ms
      })
    })
  }

  nextSong(){
    const currentSongURI = this.state.nowPlaying.uri
    var next;
    for(var i=0; i < this.state.album.tracks.length; i++){
      var albumSongURI = this.state.album.tracks[i].uri
      if (currentSongURI === albumSongURI) {
        if(i < this.state.album.tracks.length - 1){
          next = this.state.album.tracks[i+1]
        } else {
          next = this.state.album.tracks[0]
        }
        break
      }
    }
    spotifyWebApi.play({
      uris: [next.uri],
      position_ms: 0
    })
    .then(() => {
      spotifyWebApi.getMyCurrentPlaybackState()
      .then((res) => {
        this.setState({
          play: {
            position: res.progress_ms
          },
          nowPlaying: {
            name: res.item.name,
            image: res.item.album.images[0].url,
            uri: res.item.uri,
            progress: res.progress_ms,
            duration: res.item.duration_ms,
            playing: res.is_playing,
            album: res.item.album.name,
            albumURI: res.item.album.uri,
            albumID: res.item.album.id,
            track: res.item.track_number,
            volume: res.device.volume_percent
          }
        })
        resume = res.progress_ms
      })
    })
  }

  prevSong(){
    const currentSongURI = this.state.nowPlaying.uri
    var prev;
    for(var i=0; i < this.state.album.tracks.length; i++){
      var albumSongURI = this.state.album.tracks[i].uri
      if (currentSongURI === albumSongURI) {
        if(i !== 0){
          prev = this.state.album.tracks[i-1]
        } else {
          prev = this.state.album.tracks[this.state.album.tracks.length-1]
        }
        break
      }
    }
    spotifyWebApi.play({
      uris: [prev.uri],
      position_ms: 0
    })
    .then(() => {
      spotifyWebApi.getMyCurrentPlaybackState()
      .then((res) => {
        this.setState({
          play: {
            position: res.progress_ms
          },
          nowPlaying: {
            name: res.item.name,
            image: res.item.album.images[0].url,
            uri: res.item.uri,
            progress: res.progress_ms,
            duration: res.item.duration_ms,
            playing: res.is_playing,
            album: res.item.album.name,
            albumURI: res.item.album.uri,
            albumID: res.item.album.id,
            track: res.item.track_number,
            volume: res.device.volume_percent
          }
        })
        resume = res.progress_ms
      })
    })
  }

  // changeSong()

  adjustVolume(){
    spotifyWebApi.getMyCurrentPlaybackState()
    .then((res) => {
      var newVolume = res.device.volume_percent + 5
      this.setState({
        nowPlaying: {
          name: res.item.name,
          image: res.item.album.images[0].url,
          uri: res.item.uri,
          progress: res.progress_ms,
          duration: res.item.duration_ms,
          playing: res.is_playing,
          album: res.item.album.name,
          albumURI: res.item.album.uri,
          albumID: res.item.album.id,
          track: res.item.track_number,
          volume: newVolume
        }
      })
      console.log("Volume: " + res.device.volume_percent)
      console.log(newVolume)
    })
 }

  // const setAuthorizationHeader = (token) => {
  //   const token = 
  // }
  // adjustVolume(){
  //   axios
  //   .get('https://api.spotify.com/v1/me/player/volume')
  //   .then({
  //     volume_percent: 70
  //   })
  // }
 


  render(){
    return (
      <main className="App">
        {!this.state.loggedIn ? <a href='http://localhost:8888'>Log in to Spotify</a> : null}
        
        <div>
          {this.state.userInfo.image.length === '' ? (
            <img src={NoImg} style={{width:75, borderRadius:'50%'}} alt='no-img'/>
          ) : (
            <img src={ this.state.userInfo.image } style={{width:75, borderRadius:'50%'}} alt='user-img'/>
          )
          }
        </div>

        <div>Song: { this.state.nowPlaying.name } <br/>Album: { this.state.nowPlaying.album }</div>
        <div>
          <img src={ this.state.nowPlaying.image} style={{width:100, borderRadius:'50%'}} alt='song-img'/>
        </div>

        <div>
          <button type="button" className="btn btn-dark" onClick={ () => this.prevSong() }><Prev/></button>
          {this.state.nowPlaying.playing 
            ? <button type="button" className='btn btn-outline-success' onClick={ () => this.pauseSong() }><Pause/></button>
            : <button type="button" className='btn btn-success' onClick={ () => this.playSong() }><Play/></button>
          }
          <button type="button" className="btn btn-dark" onClick={ () => this.nextSong() }><Next/></button>
        </div>
        
        <div>
          <button type="button" className="btn btn-outline-primary" onClick={() => this.adjustVolume()}><VolumeUp/></button>
        </div>

        <button type="button" className="btn btn-success" onClick={ () => this.getAlbum() }>Get Album</button>
        
      </main>
      
      
    );
  }
  
}

export default App;
