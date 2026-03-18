export default function PosterViewer({ fileUrl }) {

    if (!fileUrl) {
        return (
            <p className="text-gray-500 text-sm">
                No poster uploaded yet.
            </p>
        );
    }

    return (
        <div className="w-full h-[700px] border rounded mt-3">
            <iframe
                src={fileUrl}
                title="Poster Viewer"
                className="w-full h-full"
            />
        </div>
    );
}