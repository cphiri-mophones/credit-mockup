import { useLocation } from './navigation';
import { Activate } from './screens/Activate';
import { Call } from './screens/Call';
import { Decide } from './screens/Decide';
import { Details } from './screens/Details';
import { Offer } from './screens/Offer';
import { Queue } from './screens/Queue';
import { Verify } from './screens/Verify';
import { ReviewProvider } from './state/ReviewProvider';

function Screen() {
  const { route, sub } = useLocation();
  switch (route) {
    case 'details':
      return <Details tab={sub} />;
    case 'verify':
      return <Verify />;
    case 'offer':
      return <Offer />;
    case 'call':
      return <Call />;
    case 'decide':
      return <Decide />;
    case 'activate':
      return <Activate />;
    default:
      return <Queue />;
  }
}

export default function App() {
  return (
    <ReviewProvider>
      <Screen />
    </ReviewProvider>
  );
}
