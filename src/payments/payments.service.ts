import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
    private readonly stripe = new Stripe(envs.stripeSecretKey);

    async createPaymentSession(paymentSessionDto: PaymentSessionDto){
        const { currency, items, orderId } = paymentSessionDto;

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
                metadata: {
                    orderId
                }
            },

            line_items: lineItems,
            mode: 'payment',
            success_url: envs.stripeSuccessUrl,
            cancel_url: envs.stripeCancelUrl,
        });
    }

    async stripeWebhook( req: Request, res: Response){
        console.log(req.headers);
        const sig = req.headers['stripe-signature'] as string;
        let event: Stripe.Event;
        const endpointSecret = envs.stripeEndpointSecret;

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

        switch( event.type ){
            case 'charge.succeeded':
                //TODO: llamar nuestro microservicio
                const chargeSucceeded = event.data.object;
                console.log(event.data.object);
                console.log(chargeSucceeded.metadata);
                console.log(chargeSucceeded.metadata.orderId);
            break;

            default:
                console.log(`Event ${ event.type } not handled`)
        }

        return res.status(200).json({ sig });

    }
}