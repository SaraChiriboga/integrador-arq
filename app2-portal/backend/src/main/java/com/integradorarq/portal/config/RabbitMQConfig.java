package com.integradorarq.portal.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String SOLICITUD_EXCHANGE = "solicitud.exchange";
    public static final String SOLICITUD_QUEUE = "solicitud.osint.queue";
    public static final String SOLICITUD_ROUTING_KEY = "solicitud.osint";

    public static final String OSINT_EXCHANGE = "osint.exchange";
    public static final String OSINT_QUEUE = "osint.completado.queue";
    public static final String OSINT_ROUTING_KEY = "osint.completado";

    public static final String REPORTE_EXCHANGE = "reporte.exchange";
    public static final String REPORTE_ROUTING_KEY = "reporte.listo";

    // --- Exchange, Queue y Binding para solicitud.osint (enviamos nosotros) ---
    @Bean
    public TopicExchange solicitudExchange() {
        return new TopicExchange(SOLICITUD_EXCHANGE, true, false);
    }

    @Bean
    public Queue solicitudQueue() {
        return new Queue(SOLICITUD_QUEUE, true);
    }

    @Bean
    public Binding solicitudBinding(Queue solicitudQueue, TopicExchange solicitudExchange) {
        return BindingBuilder.bind(solicitudQueue).to(solicitudExchange).with(SOLICITUD_ROUTING_KEY);
    }

    // --- Exchange, Queue y Binding para osint.completado (consumimos nosotros) ---
    @Bean
    public TopicExchange osintExchange() {
        return new TopicExchange(OSINT_EXCHANGE, true, false);
    }

    @Bean
    public Queue osintQueue() {
        return new Queue(OSINT_QUEUE, true);
    }

    @Bean
    public Binding osintBinding(Queue osintQueue, TopicExchange osintExchange) {
        return BindingBuilder.bind(osintQueue).to(osintExchange).with(OSINT_ROUTING_KEY);
    }

    // --- Exchange para reporte.listo (enviamos nosotros, el consumidor crea su queue) ---
    @Bean
    public TopicExchange reporteExchange() {
        return new TopicExchange(REPORTE_EXCHANGE, true, false);
    }

    // --- Configuración de serialización JSON ---
    @Bean
    public Jackson2JsonMessageConverter producerJackson2MessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(producerJackson2MessageConverter());
        return rabbitTemplate;
    }
}
