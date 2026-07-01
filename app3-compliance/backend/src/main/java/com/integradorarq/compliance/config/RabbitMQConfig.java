package com.integradorarq.compliance.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String OSINT_EXCHANGE = "osint.exchange";
    public static final String COMPLIANCE_QUEUE = "compliance.osint.completado.queue";
    public static final String ROUTING_KEY_OSINT_COMPLETADO = "osint.completado";
    public static final String ROUTING_KEY_ALERTA_COMPLIANCE = "alerta.compliance";

    @Bean
    public TopicExchange osintExchange() {
        return new TopicExchange(OSINT_EXCHANGE);
    }

    @Bean
    public Queue complianceQueue() {
        return new Queue(COMPLIANCE_QUEUE, true); // durable = true
    }

    @Bean
    public Binding bindingComplianceQueue(Queue complianceQueue, TopicExchange osintExchange) {
        return BindingBuilder.bind(complianceQueue).to(osintExchange).with(ROUTING_KEY_OSINT_COMPLETADO);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
