import axios from "axios";
import {showAlert} from './alert';

const stripe = Stripe('pk_test_51HwmwNByobw5CeSeFOYTyhGENBf2d6RHcxGDwTOmz9AaWOEtcbollu2l6e7fVYcAqmECI5FLcfI6uPi20Y7VSLNp00qdoaSIHT');

export const bookTour = async (tourId) => {
    try {
        const url = `/api/v1/bookings/checkout-session/${tourId}`
        // 1) Get the session from the server
        const session = await axios(url);
        console.log(session);

    // 2) Create checkout form + charge the credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    }catch(err) {
        showAlert('error', err)
    }
    
}