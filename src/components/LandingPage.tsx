import React, { useEffect } from 'react';
import Spinner from './common/Spinner';

// onLogout is removed from props as it's no longer needed here.
interface LandingPageProps {}

const LandingPage: React.FC<LandingPageProps> = () => {

    useEffect(() => {
        // This effect runs once when the component mounts.
        // Its only job is to immediately redirect the user.
        // By not clearing the session here, we prevent the navigation loop.
        window.location.href = 'https://www.adobe.com';
    }, []); // The empty dependency array ensures this runs only once.

    // Display a simple loading indicator. This will only be visible for
    // the brief moment it takes the browser to initiate the redirect.
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div
                aria-live="polite"
                role="status"
                className="flex flex-col items-center justify-center text-center"
            >
                <Spinner size="lg" />
                <p className="text-gray-600 mt-4 font-semibold">Redirecting...</p>
            </div>
        </div>
    );
};

export default LandingPage;
