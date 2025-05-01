import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class HealthCheckController {

    @Get()
    HealthCheck(){
        return 'WebHook is up and running!!';
    }

}