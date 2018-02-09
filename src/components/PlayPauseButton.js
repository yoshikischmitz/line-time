import React, { Component } from 'react';
import PropTypes from 'prop-types';

const PlayPauseButton = ({playing, onClick}) => {
	const stateClass = playing ? "playing" : "paused"
	return (
		<div className={["player-button", stateClass].join(" ")} onClick={onClick}>
	  </div>
	)
}

PlayPauseButton.propTypes = {
	playing: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired
}

export default PlayPauseButton
