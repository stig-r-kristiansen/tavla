import React from 'react'
import EnturService from '@entur/sdk'
import moment from 'moment'
import Logo from '../components/icons/Logo'
import '../components/table/styles.css'
import { Bus, CityBike } from '../components/icons'

const service = new EnturService()

const position = {
    latitude: 59.903653,
    longitude: 10.739232,
}

function getIcon(type, props) {
    switch (type) {
        case 'bus':
            return <Bus color="#5AC39A" {...props} />
        case 'bike':
            return <CityBike {...props} />
        default:
            return null
    }
}

class DepartureBoard extends React.Component {
    state = {
        stationData: [],
        stopsData: [],
    }

    updateInterval = undefined

    stopPlaceDepartures = () => {
        const stops = this.state.stopsData
        stops.forEach((stop, index) => {
            service.getStopPlaceDepartures(stop.id, { onForBoarding: true, departures: 10 }).then(departures => {
                const lineData = departures.map(departure => {
                    const { expectedDepartureTime, destinationDisplay, serviceJourney } = departure
                    const { line } = serviceJourney.journeyPattern
                    const departureTime = moment(expectedDepartureTime)
                    const minDiff = departureTime.diff(moment(), 'minutes')

                    return {
                        destination: destinationDisplay.frontText,
                        type: line.transportMode,
                        code: line.publicCode,
                        time: minDiff < 15 ? (minDiff.toString() + 'min') : departureTime.format('HH:mm'),
                    }
                })
                const newList = [...this.state.stopsData ]
                newList[index].departures = lineData

                this.setState({
                    stopsData: newList,
                })
            })
        })
    }

    updateTime = () => {
        service.getBikeRentalStations(position, 200).then(stations => {
            this.setState({
                stationData: stations,
            })
        })
        this.stopPlaceDepartures()
    }

    componentDidMount() {
        service.getStopPlacesByPosition(position, 500).then(stops => {
            const stopsData = stops.map(stop => {
                return {
                    ...stop,
                    departures: [],
                }
            })
            this.setState({ stopsData })
            this.stopPlaceDepartures()
            this.updateTime()
        })
        this.updateInterval = setInterval(this.updateTime, 10000)
    }

    componentWillUnmount() {
        clearInterval(this.updateInterval)
    }

    renderList() {
        const lineData = this.state.stopsData
        return (
            lineData.map(stop => {
                return this.renderStopPlace(stop)
            })
        )
    }

    renderBikeStationList() {
        const stationData = this.state.stationData

        return stationData.map(({
            name, bikesAvailable, spacesAvailable, id,
        }) => {
            return (
                <tr className="row" key={id}>
                    <td className="time">{bikesAvailable}/{bikesAvailable+spacesAvailable}</td>
                    <td className="type">{getIcon('bike')}</td>
                    <td className="route">{name}</td>
                </tr>
            )
        })
    }

    renderStopPlace(stop) {
        return (
            <div className="stop-place" key={stop.id}>
                <h3>{stop.name}</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th className="time">Avgang</th>
                            <th className="type">Linje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.renderDepartures(stop.departures)}
                    </tbody>
                </table>
            </div>
        )
    }

    renderDepartures(departures) {
        return (departures.map(({
            time, type, code, destination,
        }, index) => {
            return (
                <tr className="row" key={index}>
                    <td className="time">{time}</td>
                    <td className="type">{getIcon(type)}</td>
                    <td className="route">
                        {code} {destination}
                    </td>
                </tr>
            )
        }))
    }


    render() {
        return (
            <div className="app">
                <div className="main-content">
                    <h1>Avgangstider</h1>
                    <h2>Vippetangen</h2>
                    <div className="departure">
                        <div className="departure-table">
                            <div className="content-title">
                                <h3>
                                    Platform
                                </h3>
                                <hr />
                            </div>
                            {this.state.stopsData.length > 0 ? this.renderList() : null}
                        </div>
                        <div className="departure-table">
                            <div className="content-title">
                                <h3>
                                    Bysykkel
                                </h3>
                                <hr />
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="time">Ledig</th>
                                        <th className="type">Sted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.stationData.length > 0 ? this.renderBikeStationList() : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <Logo />
            </div>
        )
    }
}

export default DepartureBoard
