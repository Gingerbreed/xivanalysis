import {SidebarContent} from 'components/GlobalSidebar'
import JobIcon from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {getDataBy} from 'data'
import JOBS, {ROLES} from 'data/JOBS'
import {observable, reaction, runInAction} from 'mobx'
import {disposeOnUnmount, observer} from 'mobx-react'
import {Conductor} from 'parser/Conductor'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Header} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './Analyse.module.css'
import ResultSegment from './ResultSegment'
import SegmentLinkItem from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'
import {AnalysisLoader} from 'components/ui/SharedLoaders'

@observer
class Analyse extends Component {
	static contextType = StoreContext

	@observable conductor;
	@observable complete = false;

	static propTypes = {
		report: PropTypes.object.isRequired,
		fight: PropTypes.string.isRequired,
		combatant: PropTypes.string.isRequired,
	}

	get fightId() {
		return parseInt(this.props.fight, 10)
	}

	get combatantId() {
		return parseInt(this.props.combatant, 10)
	}

	componentDidMount() {
		const {report, fight, combatant} = this.props

		disposeOnUnmount(this, reaction(
			() => ({
				report,
				params: {fight, combatant},
			}),
			this.fetchEventsAndParseIfNeeded,
			{fireImmediately: true},
		))
	}

	fetchEventsAndParseIfNeeded = async ({report, params}) => {
		// If we don't have everything we need, stop before we hit the api
		// TODO: more checks
		const valid = report
				&& !report.loading
				&& params.fight
				&& params.combatant
		if (!valid) { return }

		// NOTE: This is here in an attempt to get some log data for an otherwise unreproducable bug.
		if (report.fights == null) {
			console.warn('Report fights null, error incoming.', report)
		}

		// We've got this far, boot up the conductor
		const fight = report.fights.find(fight => fight.id === this.fightId)
		const combatant = report.friendlies.find(friend => friend.id === this.combatantId)
		const conductor = new Conductor(report, fight, combatant)

		// Run checks, then the parse. Throw any errors up to the error store.
		try {
			conductor.sanityCheck()
			await conductor.configure()
			await conductor.parse()
		} catch (error) {
			this.context.globalErrorStore.setGlobalError(error)
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			return
		}

		// Signal completion
		runInAction(() => {
			this.conductor = conductor
			this.complete = true
		})
	}

	render() {
		const report = this.props.report

		// Still loading the parser or running the parse
		// TODO: Nice loading bar and shit
		if (!this.conductor || !this.complete) {
			return <AnalysisLoader/>
		}

		// Report's done, build output
		const player = report.friendlies.find(friend => friend.id === this.combatantId)
		const job = getDataBy(JOBS, 'logType', player.type)
		const role = job? ROLES[job.role] : undefined
		const results = this.conductor.getResults()

		return <SegmentPositionProvider>
			<SidebarContent>
				{job && (
					<Header className={styles.header}>
						<JobIcon job={job}/>
						<Header.Content>
							<NormalisedMessage message={job.name}/>
							{role && (
								<Header.Subheader>
									<NormalisedMessage message={role.name}/>
								</Header.Subheader>
							)}
						</Header.Content>
					</Header>
				)}

				{results.map((result, index) => (
					<SegmentLinkItem
						key={index}
						index={index}
						result={result}
					/>
				))}
			</SidebarContent>

			<div className={styles.resultsContainer}>
				{results.map((result, index) => (
					<ResultSegment index={index} result={result} key={index}/>
				))}
			</div>
		</SegmentPositionProvider>
	}
}

export {Analyse}