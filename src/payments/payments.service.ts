import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
    private readonly stripe = new Stripe(envs.stripeSecret);

    async createPaymentSession(){
        return await this.stripe.checkout.sessions.create({
            payment_intent_data: {
                metadata: {}
            },

            line_items:[
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'T-Shirt'
                        },
                        unit_amount: 2000
                    },
                    quantity: 2
                }
            ],
            mode: 'payment',
            success_url: 'http://localhost:3003/payments/success',
            cancel_url: 'http://localhost:3003/payments/cancel',
        })
    }
}
