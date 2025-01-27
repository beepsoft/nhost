import { GenericSchema, NhostGraphqlClient } from '@nhost/graphql-js'
import { urlFromSubdomain } from '../utils/helpers'
import { NhostClientConstructorParams } from '../utils/types'

/**
 * Creates a client for GraphQL from either a subdomain or a URL
 */
export function createGraphqlClient<Schema extends GenericSchema | undefined>(
  params: NhostClientConstructorParams<Schema>
) {
  const graphqlUrl =
    'subdomain' in params || 'backendUrl' in params
      ? urlFromSubdomain(params, 'graphql')
      : params.graphqlUrl

  if (!graphqlUrl) {
    throw new Error('Please provide `subdomain` or `graphqlUrl`.')
  }

  return new NhostGraphqlClient({ url: graphqlUrl, ...params })
}
