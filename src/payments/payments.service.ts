import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
    private readonly stripe = new Stripe(envs.stripeSecret);

    async createPaymentSession(paymentSessionDto: PaymentSessionDto){
        const { currency, items } = paymentSessionDto;

        const lineItems = items.map( item => {
            return {
                price_data: {
                    currency,
                    product_data: {
                        name: item.name
                    },
                    unit_amount: Math.round( item.price * 100 )
                },
                quantity: item.quantity
            }
        });

        return await this.stripe.checkout.sessions.create({
            payment_intent_data: {
                metadata: {}
            },

            line_items: lineItems,
            mode: 'payment',
            success_url: 'http://localhost:3003/payments/success',
            cancel_url: 'http://localhost:3003/payments/cancel',
        });
    }

    async stripeWebhook( req: Request, res: Response){
        const sig = req.headers['stripe-signature'] as string;
        let event: Stripe.Event;
        const endpointSecret = "whsec_86309b22d9d0fa43dc8a0ec7bf3b279f04e6cd241316c9a6c002b7d70e2307a7";

        try {
            event = this.stripe.webhooks.constructEvent(
                req['rawBody'],
                sig,
                endpointSecret
            );
        } catch (error) {
            console.log('error', error.message);
            res.status(400).send(`Webhook Error: ${error.message}`);
            return;
        }
        console.log({ event })
        return res.status(200).json({ sig });
    }
}