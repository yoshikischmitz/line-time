import {connect} from 'react-redux'
import {startTimer} from '../actions'
import DisplayTimer from '../components/DisplayTimer'

const mapStateToProps = (state, ownProps) => {
	let seconds = state.timerState === 'Playing' ? state.secondsRemaining : state.chunks[state.currentChunk].intervalSeconds || 0
	return {seconds: seconds, state: state.timerState}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onClick: () => {
			dispatch(startTimer())
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(DisplayTimer)
