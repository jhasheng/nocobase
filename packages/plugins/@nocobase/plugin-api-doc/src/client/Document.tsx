import { css, useAPIClient, useRequest } from '@nocobase/client';
import { Select, Space, Spin, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import SwaggerUIBundle from 'swagger-ui-dist/swagger-ui-bundle';
import 'swagger-ui-dist/swagger-ui.css';
import { useTranslation } from '../locale';

const DESTINATION_URL_KEY = 'API_DOC:DESTINATION_URL_KEY';
const getUrl = () => localStorage.getItem(DESTINATION_URL_KEY);

const Documentation = () => {
  const apiClient = useAPIClient();
  const { t } = useTranslation();
  const swaggerUIRef = useRef();

  const { data: urls } = useRequest<{ data: { name: string; url: string }[] }>({ url: 'swagger:getUrls' });
  const requestInterceptor = (req) => {
    if (!req.headers['Authorization']) {
      const match = location.pathname.match(/^\/apps\/([^/]*)\//);
      // multi apps need to set X-App header
      req.headers['X-App'] = match?.[1] || 'main';
      req.headers['Authorization'] = `Bearer ${apiClient.auth.getToken()}`;
    }
    return req;
  };

  const [destination, onDestinationChange] = useState<string>(getUrl());

  useEffect(() => {
    if (destination) {
      localStorage.setItem(DESTINATION_URL_KEY, destination);
    }
  }, [destination]);

  useEffect(() => {
    if (!urls?.data?.length) return;

    if (!destination || !urls.data.find((item) => item.url === getUrl())) {
      onDestinationChange(urls.data[0].url);
    }
  }, [destination, urls]);

  useEffect(() => {
    SwaggerUIBundle({
      requestInterceptor,
      url: destination,
      domNode: swaggerUIRef.current,
    });
  }, [destination]);

  if (!destination) {
    return <Spin />;
  }
  return (
    <Space
      direction="vertical"
      style={{
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 1460px;
            width: 100%;
            padding: 16px 20px;
          `}
        >
          <Typography.Text
            style={{
              whiteSpace: 'nowrap',
            }}
            strong
          >
            {t('Select a definition')}
          </Typography.Text>
          <Select
            showSearch
            value={destination}
            options={urls?.data}
            style={{
              width: '100%',
            }}
            fieldNames={{
              label: 'name',
              value: 'url',
            }}
            onChange={onDestinationChange}
          />
        </div>
      </div>
      <div ref={swaggerUIRef}></div>
      {/* <SwaggerUI url={destination} requestInterceptor={requestInterceptor} persistAuthorization deepLinking /> */}
    </Space>
  );
};

export default Documentation;
