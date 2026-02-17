import Button from "../components/ui/Button";
import { Card, CardTitle, CardBody } from "../components/ui/Card";
import NavButton from "../components/ui/NavButton";


export default function Home() {

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-5x1 px-4 py-10">
                <header className="flex items-center justify-center">
                    <div>
                        <h1 className="text-2x1 font-bold">My School Project</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Practicing React + Tailwind with clean structure.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="secondary">Sign In</Button>
                        <Button>Create</Button>
                    </div>
                </header>

                <main className="mt-8 grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardTitle>Component-driven</CardTitle>
                        <CardBody>
                            Reuse UI components across the page
                        </CardBody>
                    </Card>

                    <Card>
                        <CardTitle>Scale easily</CardTitle>
                        <CardBody>
                            Pages are separate from UI components and helpers.
                        </CardBody>
                    </Card>
                    <NavButton to='/judges'>Judging Page</NavButton>
                    <NavButton to='/admin'>Admin Page</NavButton>
                </main>
            </div>
        </div>
    );
}