import React from 'react'
import PropTypes from 'prop-types'
import Transcript from './Transcript'
import Metadata from './Metadata'
import Search from './Search'
import './Player.css'

class Player extends React.Component {
  constructor() {
    super()
    this.state = {
      loaded: false,
      hasTranscript: null, // null = pas encore vérifié, true/false après test
      currentTime: 0,
      query: ''
    }
    this.track = React.createRef()
    this.metatrack = React.createRef()
    this.audio = React.createRef()

    this.onLoaded = this.onLoaded.bind(this)
    this.seek = this.seek.bind(this)
    this.checkIfLoaded = this.checkIfLoaded.bind(this)
    this.updateQuery = this.updateQuery.bind(this)
  }

  componentDidMount() {
    // Vérif rapide si pas de transcript fourni
    if (!this.props.transcript || this.props.transcript.trim() === "") {
      this.setState({ hasTranscript: false })
      return
    }

    // Vérif rapide du contenu du fichier .vtt
    fetch(this.props.transcript)
        .then(res => res.text())
        .then(text => {
          const hasContent = text.trim().length > 0 && /-->/g.test(text)
          if (!hasContent) {
            // Pas de cues → on affiche direct "Aucune transcription"
            this.setState({ hasTranscript: false })
          } else {
            // Lancer la détection normale
            this.checkIfLoaded()
          }
        })
        .catch(() => {
          this.setState({ hasTranscript: false })
        })
  }

  render () {
    let track = null
    let metatrack = null

    if (this.state.loaded && this.track.current && this.track.current.track) {
      track = this.track.current.track
      metatrack = this.metatrack.current.track
    }

    const preload = this.props.preload ? "true" : "false"

    const metadata = this.props.metadata
        ? <Metadata
            url={this.props.metadata}
            seek={this.seek}
            track={metatrack} />
        : ""

    return (
        <div className="webvtt-player">
          <div className="media">
            <div className="player">
              <audio
                  controls
                  crossOrigin="anonymous"
                  onLoadedData={this.onLoaded}
                  preload={preload}
                  ref={this.audio}>
                <source src={this.props.audio} />
                <track default
                       kind="subtitles"
                       src={this.props.transcript}
                       ref={this.track} />
                <track default
                       kind="metadata"
                       src={this.props.metadata}
                       ref={this.metatrack} />
              </audio>
            </div>

            {this.state.hasTranscript === false ? (
                <p>Aucune transcription</p>
            ) : this.state.hasTranscript === true ? (
                <>
                  <Search query={this.state.query} updateQuery={this.updateQuery} />
                  <div className="tracks">
                    <Transcript
                        url={this.props.transcript}
                        seek={this.seek}
                        track={track}
                        query={this.state.query} />
                    {metadata}
                  </div>
                  <Search query={this.state.query} updateQuery={this.updateQuery} />
                </>
            ) : (
                <p>Chargement de la transcription...</p>
            )}
          </div>
        </div>
    )
  }

  onLoaded() {
    this.setState({ loaded: true, hasTranscript: true })
  }

  checkIfLoaded(tries = 0) {
    tries += 1
    const e = this.track.current
    if (e && e.track && e.track.cues && e.track.cues.length > 0) {
      this.onLoaded()
    } else if (!this.state.loaded) {
      const wait = 25 * Math.pow(tries, 2)
      setTimeout(this.checkIfLoaded, wait, tries)
    }
  }

  seek(secs) {
    this.audio.current.currentTime = secs
    this.audio.current.play()
  }

  updateQuery(query) {
    this.setState({ query })
  }
}

Player.propTypes = {
  transcript: PropTypes.string.isRequired,
  metadata: PropTypes.string,
  audio: PropTypes.string,
  preload: PropTypes.string,
  // Ajoute ici toutes les autres props utilisées
};


export default Player