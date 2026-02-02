import {Card, CardBody, CardTitle} from "../components/ui/Card.jsx";
import {event} from "../mock/events.js";
import Button from "../components/ui/Button.jsx"
import NavButton from "../components/ui/NavButton.jsx";


export default function AdminPage() {

    return (
        <div className="text-center text-bold text-5xl">
            Welcome to the Admin Page!
            <Card>
                <CardTitle>Events List</CardTitle>
                <CardBody>
                    <p className="text-lg mb-4">Here are the current events:</p>

                    <ul className="text-base space-y-2">
                        {event.map((event) => (
                            <li key={event.id} className="border p-2 rounded">
                                <p className="font-semibold">{event.name}</p>
                                <p className="text-sm text-gray-500">{event.date}</p>
                            </li>
                        ))}
                    </ul>

                </CardBody>
            </Card>
            <NavButton to='/newevent'>+ New Event</NavButton>
        </div>
    )
}