--
-- PostgreSQL database dump
--

\restrict UfYxy74FbCO5c8xCbsljXIGVuIfL1YGDwxSNhk1RfxF6llIjkd6XJzbgUm5JJuj

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: requests; Type: TABLE; Schema: public; Owner: portal_user
--

CREATE TABLE public.requests (
    id uuid NOT NULL,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    pdf_url text,
    requester_email character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    target_id character varying(10) NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE public.requests OWNER TO portal_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: portal_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    cedula character varying(10) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(255) NOT NULL
);


ALTER TABLE public.users OWNER TO portal_user;

--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: users uk_72nq30heq3jovypjxbe289jc; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_72nq30heq3jovypjxbe289jc UNIQUE (cedula);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: requests fk8usbpx9csc6opbjg1d7kvtf8c; Type: FK CONSTRAINT; Schema: public; Owner: portal_user
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT fk8usbpx9csc6opbjg1d7kvtf8c FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict UfYxy74FbCO5c8xCbsljXIGVuIfL1YGDwxSNhk1RfxF6llIjkd6XJzbgUm5JJuj

