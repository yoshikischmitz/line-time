import {connect} from 'react-redux'
import React from 'react'
import { Icon } from '@doist/reactist'

const header = () => (
	<div className="header">
		<Icon image="/img/plus.svg" />
		<Icon image="/img/plus.svg" />
		<Icon image="/img/plus.svg" />
	</div>
)

export default connect(null, null)(header)
